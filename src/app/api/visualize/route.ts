import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import { prisma } from '@/lib/db';

const client = new Anthropic();

export type StepDiff = {
  field: string;
  from: unknown;
  to: unknown;
  impact: string;
};

export type TraceStep = {
  step: number;
  line: number;
  event: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  diff: StepDiff[];
  notes: string;
};

export type Checkpoint = {
  name: string;
  step: number;
  expected: unknown;
  actual: unknown;
  status: 'pass' | 'fail';
};

export type ExecutionFrame = {
  node_id: string;
  event: string;
  line: number;
  state: Record<string, string>;
  highlight: 'normal' | 'success';
  comparing: string[];
};

export type VisualizationData = {
  tracked: string[];
  steps: TraceStep[];
  checkpoints: Checkpoint[];
  mermaid: {
    flowchart: string;
  };
  execution_path: ExecutionFrame[];
};

export async function POST(request: NextRequest) {
  const { code, language, problemSlug, input, expectedOutput } = await request.json();

  // Strip blank lines so AI line numbers exactly match what the viewer displays
  const strippedLines = (code as string).split('\n').filter((l: string) => l.trim() !== '');
  const strippedCode  = strippedLines.join('\n');

  // Prefix every line with its 1-indexed number so the AI can never miscount
  // (e.g. it sometimes skips `class Solution:` as line 1 without explicit numbering)
  const numberedCode = strippedLines.map((l, i) => `${i + 1}: ${l}`).join('\n');

  const problem = await prisma.problem.findUnique({
    where: { slug: problemSlug },
    select: { title: true, description: true },
  });

  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  const prompt = `You are a "Execution Visualizer" that outputs ONLY machine-checkable JSON artifacts, not prose.

Context:
Problem: ${problem.title}
${problem.description}

Student code (${language}) — line numbers are shown explicitly, use them exactly:
\`\`\`${language}
${numberedCode}
\`\`\`

Single test case:
- Input: ${JSON.stringify(input)}
- Expected output: ${JSON.stringify(expectedOutput)}

Goal:
Produce a complete step-by-step execution trace, a Mermaid flowchart, and an execution_path for THIS exact input.

ABSOLUTE REQUIREMENTS (read carefully):
1) Mechanical simulation only:
   - Simulate the code like a debugger: evaluate every condition using the current concrete values.
   - Never assume loop behavior. Never skip or summarize steps.

2) Consistency across artifacts:
   - The final returned value implied by the trace MUST match the final "actual" value in checkpoints.
   - execution_path state MUST be consistent with steps (same variable values at same moment).
   - Node IDs in execution_path MUST exist in the Mermaid flowchart.
   - Line numbers: use EXACTLY the numbers prefixed on each line in the code block above (e.g. if the line reads "5: while j<len(nums):", its line number is 5). Never derive line numbers yourself — read them directly from the prefix.

3) What to trace:
   - Track only 2–4 core variables/structures that drive the result.
   - ALSO track any derived/indexed values used in comparisons or indexing (e.g. if comparing nums[i] and nums[j], include those as separate tracked entries).

4) Steps:
   - Each trace step = one meaningful operation (one condition check, one assignment, one pointer update, one return).
   - event must be 10 words or fewer.
   - Show ALL iterations — do NOT skip or summarize any steps.

Mermaid flowchart rules (CRITICAL — every violation causes render failure):
- Start with exactly: flowchart TD
- Node IDs: simple alphanumeric only (A, B, loopCheck, step1). No spaces, hyphens, punctuation.
- ALWAYS wrap every node label in double quotes: A["label"], B{"label"}, C("label")
- Never place any of these characters INSIDE label text: square brackets, curly braces, pipe, angle brackets, double quote, hash, ampersand, semicolon. Rephrase to avoid them.
- Edges: use --> with optional labels: A -->|Yes| B
- Each node label MUST end with a line reference: " · L{n}"

execution_path rules:
- Ordered sequence of ALL nodes visited for THIS input, including repeated loop visits.
- event: 10 words or fewer.
- line: read directly from the numbered prefix in the code block.
- state: MUST contain EVERY variable in "tracked" at EVERY frame. Carry forward unchanged values — never omit a tracked variable from any frame.
- highlight: use "normal" for all steps; use "success" only when the test truly passes (actual === expected).
- comparing: list the tracked variable keys from state that are actively being evaluated in a condition check (if/while/elif/for). Use the EXACT same key strings as in state. Use [] for non-condition steps (assignments, swaps, returns).

Output format:
Return ONLY raw JSON (no markdown fences, no extra text) matching this schema exactly:

{
  "tracked": ["<var>"],
  "steps": [
    {
      "step": <int>, "line": <int>, "event": "<str>",
      "before": {"<var>": <val>}, "after": {"<var>": <val>},
      "diff": [{"field": "<var>", "from": <val>, "to": <val>, "impact": "<str>"}],
      "notes": "<str>"
    }
  ],
  "checkpoints": [
    {"name": "<str>", "step": <int>, "expected": <val>, "actual": <val>, "status": "pass"|"fail"}
  ],
  "mermaid": {
    "flowchart": "<Mermaid flowchart TD string>"
  },
  "execution_path": [
    {
      "node_id": "<str>", "event": "<str>", "line": <int>,
      "state": {"<var>": "<str>"},
      "highlight": "normal"|"success",
      "comparing": ["<var>"]
    }
  ]
}

Final checks before responding:
- Compute the actual return value from your simulation and place it in checkpoints final "actual".
- Ensure checkpoints final status correctly reflects actual vs expectedOutput.
- Ensure mermaid node IDs match execution_path node_id values exactly.
`;

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 32000,
    messages: [{ role: 'user', content: prompt }],
  });

  const message = await stream.finalMessage();
  const content = message.content[0];

  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 });
  }

  const rawText = content.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const visualization: VisualizationData = JSON.parse(jsonrepair(rawText));

  // Write debug output to file
  const fs = await import('fs');
  const debugOutput = `=== RAW LLM OUTPUT ===
${content.text}

=== MERMAID FLOWCHART ===
${visualization.mermaid.flowchart}

=== EXECUTION PATH ===
${JSON.stringify(visualization.execution_path, null, 2)}

=== FULL VISUALIZATION ===
${JSON.stringify(visualization, null, 2)}
`;
  fs.writeFileSync('llm-debug-output.txt', debugOutput);

  return NextResponse.json({ visualization });
}