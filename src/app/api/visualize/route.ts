import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import { prisma } from '@/lib/db';

const client = new Anthropic();

export type BugLocation = { line: number; reason: string };

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
  highlight: 'normal' | 'error' | 'success';
};

export type VisualizationData = {
  summary: {
    bug_location: BugLocation;
    first_divergence_step: number;
    high_level_cause: string;
  };
  assumptions: string[];
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

  const problem = await prisma.problem.findUnique({
    where: { slug: problemSlug },
    select: { title: true, description: true },
  });

  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  const prompt = `You are a "Debug Visualizer" that outputs renderable artifacts, not prose.

Problem: ${problem.title}
${problem.description}

Student's code (${language}):
\`\`\`${language}
${code}
\`\`\`

Test case:
- Input: ${JSON.stringify(input)}
- Expected output: ${JSON.stringify(expectedOutput)}

Goal: Produce a step-by-step execution trace, a Mermaid flowchart, and an animation path that together make the bug visually obvious.

Rules:
- Mentally execute the code precisely for this input.
- Track only 2–4 variables/structures that directly influence the result.
- Each trace step = one meaningful operation (one iteration, one push/pop/compare, one return).
- "event" must be ≤ 10 words.
- Cap at 18 trace steps. For long loops show first 2, a mid-point labelled "... N iterations ...", last 2.
- first_divergence_step: the step number where behaviour first differs from correct. -1 if no divergence.

Mermaid flowchart rules (CRITICAL — every violation causes a render failure):
- Use "flowchart TD" (never "graph").
- ALWAYS wrap every node label in double quotes: A["label"], B{"label"}, C("label").
- NEVER use these characters inside any label — they break the Mermaid parser:
    [ ]  { }  |  < >  "
  Rephrase to avoid them entirely. Examples:
    BAD:  B{"i != d[stack[-1]]?"}    GOOD: B{"i not equal to stack top?"}
    BAD:  C["push char | update i"]  GOOD: C["push char, update i"]
    BAD:  D{"len > 0?"}              GOOD: D{"length greater than 0?"}
- Node IDs: simple alphanumeric only (A, B, nodeCheck, step1). No spaces or special chars.
- Mark the error node: style errorNodeId fill:#7f1d1d,stroke:#ef4444,color:#fecaca
- Keep compact: 8–12 nodes max. Show key decisions and the divergence point.
- Each node label MUST end with a line reference using a middle dot: " · L{n}"
  Examples: A["Initialize stack · L1"], B{"Stack empty? · L7"}, C["Return False · L10"]
  Use the actual line number from the student's code that this node represents.

execution_path rules:
- This is the ordered sequence of nodes actually visited during execution of this specific input.
- Each entry's "node_id" MUST exactly match a node ID in the Mermaid flowchart.
- "event": ≤10 words describing what happens at this node.
- "line": the line number in the student's code that this node executes (1-indexed).
- "state": current values of tracked variables as short strings (e.g. arrays as "[1,2]", booleans as "true").
- "highlight":
    "normal"  — regular execution step
    "error"   — the node where the code does something wrong / diverges from expected
    "success" — the final correct-output node (use only if no error, i.e. test passes)
- Include every node visit in execution order, including repeated visits (e.g. loop back nodes).
- The same node_id may appear multiple times if the loop revisits it.
- Cap at 20 frames.

Return ONLY the raw JSON — no markdown, no code fences, no extra text.

JSON schema:
{
  "summary": {
    "bug_location": {"line": <int or 0>, "reason": "<why this line is wrong>"},
    "first_divergence_step": <int, -1 if none>,
    "high_level_cause": "<one sentence, no code>"
  },
  "assumptions": ["<string>"],
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
    {"node_id": "<str>", "event": "<str>", "line": <int>, "state": {"<var>": "<str>"}, "highlight": "normal"|"error"|"success"}
  ]
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];

  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 });
  }

  const rawText = content.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const visualization: VisualizationData = JSON.parse(jsonrepair(rawText));

  return NextResponse.json({ visualization });
}
