import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';

const client = new Anthropic();

export type HintData = {
  hints: string[];
  area: string;
};

export async function POST(request: NextRequest) {
  const { code, problemSlug, language, testResults } = await request.json();

  const problem = await prisma.problem.findUnique({
    where: { slug: problemSlug },
    select: { title: true, description: true, difficulty: true, constraints: true },
  });

  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  const failingSummary = testResults
    ? (() => {
        const failed = testResults.results?.filter((r: { passed: boolean }) => !r.passed) ?? [];
        if (failed.length === 0) return 'All visible test cases pass, but the logic may still be flawed for edge cases.';
        return `${failed.length} of ${testResults.totalTests} test cases are failing.`;
      })()
    : 'The code has not been run yet.';

  const prompt = `You are a coding tutor helping a student debug their solution. Your job is to guide them towards the answer — NOT give the answer.

Problem: ${problem.title} (${problem.difficulty})
${problem.description}
${Array.isArray(problem.constraints) && problem.constraints.length > 0 ? `\nConstraints:\n${(problem.constraints as string[]).join('\n')}` : ''}

Student's solution (${language}):
${code}

Test status: ${failingSummary}

Identify what the student is doing wrong and give 2–4 targeted hints. Rules:
- NEVER give corrected code or pseudocode
- NEVER reveal the optimal algorithm or data structure by name if they haven't used it
- Point to the specific part of their logic that is wrong (e.g. "think about what happens when the array is empty")
- Ask guiding questions where appropriate
- Be concise — one sentence per hint

Reply with ONLY a raw JSON object, no markdown, no code fences:
{
  "area": "One short phrase naming the category of mistake (e.g. 'Off-by-one error', 'Edge case handling', 'Wrong loop condition')",
  "hints": [
    "hint 1",
    "hint 2",
    "hint 3 (optional)",
    "hint 4 (optional)"
  ]
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];

  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 });
  }

  const rawText = content.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const hint: HintData = JSON.parse(rawText);

  return NextResponse.json({ hint });
}
