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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { problemSlug, problemTitle, difficulty, description, concepts, sampleInput, sampleOutput } =
    await request.json();

  const conceptList = (concepts as { title: string }[]).map((c) => c.title).join(', ') || 'General';
  const problemUrl = `/problems/${problemSlug}`;

  const prompt = `You are generating a concise flashcard for a solved coding problem. Return ONLY a raw JSON object — no markdown, no code fences, no extra text.

Problem: ${problemTitle} (${difficulty})
Description: ${description}
Concepts: ${conceptList}
Sample Input: ${JSON.stringify(sampleInput)}
Sample Output: ${JSON.stringify(sampleOutput)}
Problem URL: ${problemUrl}

JSON format:
{
  "front": "...",
  "back": "..."
}

Rules for "front":
- Line 1: Problem: ${problemTitle}
- Line 2: One crisp sentence describing what the problem asks (no fluff).
- Line 3 blank.
- Line 4: Input: <sample input values formatted cleanly>
- Line 5: Output: <sample output value>
Keep it under 50 words total.

Rules for "back":
- Line 1: Type: <problem pattern — e.g. Two Pointer, Sliding Window, Hash Map, BFS, Dynamic Programming, Greedy, Backtracking, Binary Search, Stack, etc.>
- Line 2 blank.
- Line 3: Input: <same sample input values formatted cleanly>
- Line 4: Output: <same sample output value>
- Line 5 blank.
- Line 6: Algorithm:
- Lines 7+: 3–4 numbered steps max. Each step is one short sentence (under 10 words). No pseudocode, no code — pure English. Omit obvious setup steps; only the key insight steps.
- Final line blank, then: Link: ${problemUrl}`;

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
    return NextResponse.json({ error: 'Unexpected AI response' }, { status: 500 });
  }

  const raw = result.choices[0].message.content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const { front, back } = JSON.parse(raw) as { front: string; back: string };

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email! },
  });

  const playcard = await prisma.playcard.create({
    data: {
      userId: user.id,
      section: 'problems',
      front,
      back,
    },
  });

  return NextResponse.json({ playcard });
}
