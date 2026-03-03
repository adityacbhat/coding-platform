import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const { front, back } = JSON.parse(jsonrepair(raw)) as { front: string; back: string };

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
