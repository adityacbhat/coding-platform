import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

type OpenRouterResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

export type AnalysisData = {
  isOptimal: boolean;
  optimalityExplanation: string;
  timeComplexity: string;
  timeComplexityReason: string;
  spaceComplexity: string;
  spaceComplexityReason: string;
  feedback: string;
};

export async function POST(request: NextRequest) {
  const { code, problemSlug, language, testsPassed } = await request.json();

  const problem = await prisma.problem.findUnique({
    where: { slug: problemSlug },
    select: { id: true, title: true, description: true, difficulty: true },
  });

  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  const testsNote = testsPassed
    ? 'This solution has already been verified — all test cases pass. Do NOT comment on syntax, indentation, or correctness. Focus only on algorithmic quality.'
    : 'This solution has not been run against test cases yet.';

  const prompt = `You are a concise coding interview coach. Analyze the solution below and reply with ONLY a raw JSON object — no markdown, no code fences, no extra text.

Problem: ${problem.title} (${problem.difficulty})
${problem.description}

Solution (${language}):
${code}

Important: ${testsNote}

JSON format (keep every value short — one sentence max):
{
  "isOptimal": true or false,
  "optimalityExplanation": "One short sentence: state if optimal and why, or what better approach exists.",
  "timeComplexity": "O(?)",
  "timeComplexityReason": "One short sentence naming the specific loop/operation causing this.",
  "spaceComplexity": "O(?)",
  "spaceComplexityReason": "One short sentence naming the specific variable/structure causing this.",
  "feedback": "2-3 short sentences on algorithmic quality and the most important improvement. Do not mention syntax or indentation."
}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "arcee-ai/trinity-mini:free",
      messages: [{ role: "user", content: prompt }],
      reasoning: { enabled: true }
    })
  });

  const result = await response.json() as OpenRouterResponse;

  if (!result.choices || !result.choices[0]?.message) {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 });
  }

  const rawText = result.choices[0].message.content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const analysis: AnalysisData = JSON.parse(rawText);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email! },
    });

    await prisma.$executeRaw`
      INSERT INTO user_progress (user_id, problem_id, last_analysis)
      VALUES (${user.id}, ${problem.id}, ${JSON.stringify(analysis)}::jsonb)
      ON CONFLICT (user_id, problem_id)
      DO UPDATE SET last_analysis = ${JSON.stringify(analysis)}::jsonb
    `;
  }

  return NextResponse.json({ analysis });
}
