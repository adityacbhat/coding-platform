import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const t0 = Date.now();
  console.log('[generate-test-cases] Request received');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { problemId, count } = await request.json();
  console.log(`[generate-test-cases] problemId=${problemId} count=${count}`);

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      testCases: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  console.log(`[generate-test-cases] Problem: "${problem.title}" | existing test cases: ${problem.testCases.length}`);

  const allExisting = problem.testCases.map((tc, i) => ({
    index: i + 1,
    input: tc.input,
    expectedOutput: tc.expectedOutput,
  }));

  const constraintLines = Array.isArray(problem.constraints)
    ? (problem.constraints as string[]).map((c) => `- ${c}`).join('\n')
    : 'No explicit constraints listed.';

  const prompt = `You are an expert software engineer creating comprehensive test cases for a coding problem.

Problem: ${problem.title} (${problem.difficulty})

Description:
${problem.description}

Constraints:
${constraintLines}

All existing test cases — DO NOT duplicate any of these inputs:
${JSON.stringify(allExisting, null, 2)}

Task: Generate exactly ${count} NEW test cases. None of the new inputs may match or be functionally equivalent to any existing input above.

Requirements:
1. EDGE CASES — you must include cases like: empty collections, single elements, all-same elements, maximum constraint values, minimum constraint values, negative numbers (if applicable), already-sorted/reversed inputs, duplicates, zero values, very large inputs.
2. Spread the ${count} cases across: ~40% typical/normal cases, ~60% edge/boundary cases.
3. Every input object MUST follow the EXACT same key structure as the existing test cases above.
4. Mark roughly half of the generated cases as hidden (isHidden: true) — these will be used as hidden judge test cases.
5. Set orderIndex starting from ${problem.testCases.length} and incrementing by 1.
6. Compute the correct expectedOutput for EVERY test case — it must be accurate.

CRITICAL — Unique answer rule:
Every test case input you generate MUST have EXACTLY ONE valid output. Before including a test case, mentally verify: "Is there any other valid answer for this input that a correct solution could return?" If yes, discard it and create a different input. This is especially important for:
- Problems where the answer is an index or set of indices (e.g. Two Sum): ensure the input has only one pair/combination that satisfies the condition.
- Problems where the answer is a subsequence, path, or arrangement: ensure only one arrangement is valid, or use a problem-specific canonical form.
- If the problem explicitly states the answer is unique (e.g. "guaranteed exactly one solution"), your test cases MUST enforce that guarantee — do not create inputs that accidentally have multiple solutions.

A test case with multiple valid answers will cause correct solutions to be marked as wrong. Verify every single test case before adding it.

Return ONLY a raw JSON array — no markdown, no code fences, no explanation text outside the array.

Required format:
[
  {
    "input": { <same keys as existing inputs> },
    "expectedOutput": <the correct answer>,
    "isHidden": true or false,
    "orderIndex": <integer starting from ${problem.testCases.length}>
  }
]`;

  console.log(`[generate-test-cases] Prompt length: ${prompt.length} chars | Sending to Claude...`);
  const tLlm = Date.now();

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  console.log(`[generate-test-cases] Claude responded | elapsed: ${Date.now() - tLlm}ms`);

  const rawText = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  console.log('[generate-test-cases] Raw Claude text:', rawText);

  const generated = JSON.parse(rawText);

  if (!Array.isArray(generated)) {
    console.error('[generate-test-cases] Claude did not return an array. Parsed value:', generated);
    return NextResponse.json({ error: 'Claude did not return an array' }, { status: 500 });
  }

  console.log(`[generate-test-cases] Parsed ${generated.length} test cases. Normalizing...`);
  const tDb = Date.now();

  type GeneratedTC = { input: unknown; expectedOutput: unknown; isHidden?: boolean; orderIndex?: number };

  // Rescue cases where Claude nested expectedOutput inside input
  const normalized = (generated as GeneratedTC[]).map((tc) => {
    if (
      tc.expectedOutput === undefined &&
      tc.input !== null &&
      typeof tc.input === 'object' &&
      !Array.isArray(tc.input) &&
      'expectedOutput' in (tc.input as Record<string, unknown>)
    ) {
      const { expectedOutput, ...cleanInput } = tc.input as Record<string, unknown>;
      return { ...tc, input: cleanInput, expectedOutput };
    }
    return tc;
  });

  const valid = normalized.filter(
    (tc) =>
      tc.input !== undefined &&
      tc.input !== null &&
      !Array.isArray(tc.input) &&
      typeof tc.input === 'object' &&
      Object.keys(tc.input as object).length > 0 &&
      tc.expectedOutput !== undefined
  );

  console.log(`[generate-test-cases] ${valid.length} valid (of ${generated.length} parsed) after normalize+filter`);

  const created = await prisma.$transaction(
    valid.map((tc) =>
      prisma.testCase.create({
        data: {
          problemId,
          input: JSON.parse(JSON.stringify(tc.input)),
          expectedOutput: JSON.parse(JSON.stringify(tc.expectedOutput ?? null)),
          isHidden: tc.isHidden ?? false,
          orderIndex: tc.orderIndex ?? 0,
        },
      })
    )
  );

  console.log(`[generate-test-cases] DB write done in ${Date.now() - tDb}ms | Total: ${Date.now() - t0}ms | Saved ${created.length} test cases`);

  return NextResponse.json({ testCases: created });
}
