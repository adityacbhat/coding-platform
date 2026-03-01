import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export type AlgorithmAnalysisData = {
  onTrack: boolean;
  validationMessage: string;
  hints: string[];
};

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { algorithm, problemSlug } = await request.json();

  const problem = await prisma.problem.findUnique({
    where: { slug: problemSlug },
    select: { id: true, title: true, description: true, difficulty: true },
  });

  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  const prompt = `You are a supportive coding interview coach. The user has written their planned algorithm/approach in plain text (not code) BEFORE implementing. Your role is to VALIDATE if they are thinking in the right direction — a helping mechanism to guide them, not to grade code.

Problem: ${problem.title} (${problem.difficulty})
${problem.description}

User's Algorithm / Approach (plain text):
${algorithm || '(empty — user may have not written anything yet)'}

Your job:
1. If their approach makes sense and would solve the problem: Affirm them. Say things like "You're on the right track", "Good thinking — implementing something like that should work", "Solid approach". Be encouraging. Add 1–2 brief tips (edge cases, small refinements) only if helpful — don't over-criticise.
2. If their approach has gaps or is off: Gently point out the issue. Give concrete hints to steer them in the right direction. Phrases like "You're close, but consider…", "One thing to think about…", "A common pitfall here is…". Be helpful, not discouraging.
3. Never be harsh. The goal is to validate thinking and help them succeed. Even wrong approaches should get constructive hints, not criticism.

Reply with ONLY a raw JSON object — no markdown, no code fences, no extra text:
{
  "onTrack": true or false,
  "validationMessage": "2–4 sentences: Either affirm them ('You're on the right track…') or gently explain what to reconsider, with encouragement.",
  "hints": ["Optional hint 1", "Optional hint 2"] — only include hints if they need guidance. If fully on track, can be empty array or 1 small tip. Max 3 hints, each one short sentence.
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];

  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 });
  }

  const rawText = content.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const analysis: AlgorithmAnalysisData = JSON.parse(rawText);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email! },
    });

    await prisma.userProgress.upsert({
      where: { userId_problemId: { userId: user.id, problemId: problem.id } },
      update: { lastAlgorithm: algorithm ?? '' },
      create: {
        userId: user.id,
        problemId: problem.id,
        lastAlgorithm: algorithm ?? '',
      },
    });
  }

  return NextResponse.json({ analysis, source: 'algorithm' });
}
