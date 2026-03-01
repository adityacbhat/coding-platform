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

IMPORTANT: Before generating the JSON, mentally execute the code line by line with the given input. Keep a mental "variable table" and update it at each step. Only after you have traced through the entire execution should you produce the output.

Rules:
- Mentally execute the code precisely for this input.
- Track only 2–4 variables/structures that directly influence the result.
- IMPORTANT: Also track derived/indexed values that are referenced in the code. For example:
  - If the code has pointers i, j and an array s, also show s[i], s[j] as separate tracked variables
  - If the code accesses nums[left], nums[right], show those current values
  - If the code uses stack[-1] or peek operations, show the current top value
  - These derived values help visualize what the code is actually comparing/using
- Each trace step = one meaningful operation (one iteration, one push/pop/compare, one return).
- "event" must be ≤ 10 words.
- Cap at 18 trace steps. For long loops show first 2, a mid-point labelled "... N iterations ...", last 2.
- first_divergence_step: the step number where behaviour first differs from correct. -1 if no divergence.

Mermaid flowchart rules (CRITICAL — every violation causes a render failure):
- Start with exactly: flowchart TD
- ALWAYS wrap every node label in double quotes: A["label"], B{"label"}, C("label").
- NEVER use these characters inside any label — they break the Mermaid parser:
    [ ]  { }  |  < >  "  #  &  ;
  Rephrase to avoid them entirely. Examples:
    BAD:  B{"i != d[stack[-1]]?"}    GOOD: B{"i not equal to stack top?"}
    BAD:  C["push char | update i"]  GOOD: C["push char, update i"]
    BAD:  D{"len > 0?"}              GOOD: D{"length greater than 0?"}
    BAD:  E["i < len(s)"]            GOOD: E{"i less than length?"}
- Node IDs: simple alphanumeric only (A, B, loopCheck, step1). No spaces, hyphens, or special chars.
- Edges: use --> for arrows, add labels with |text| on arrows if needed: A -->|Yes| B
- Mark the error node: style errorNodeId fill:#7f1d1d,stroke:#ef4444,color:#fecaca
- Keep compact: 8–12 nodes max. Show key decisions and the divergence point.
- Each node label MUST end with a line reference: " · L{n}"
  Examples: A["Initialize vars · L3"], B{"j less than length? · L6"}, C["Return result · L13"]
  
EXAMPLE of valid flowchart:
flowchart TD
    A["Initialize i, j, longest · L3"]
    B{"j less than length? · L6"}
    C{"chars equal? · L7"}
    D["increment j · L8"]
    E["increment i, reset j · L11"]
    F["Return longest · L13"]
    A --> B
    B -->|Yes| C
    B -->|No| F
    C -->|Yes| D
    C -->|No| E
    D --> B
    E --> B
    style E fill:#7f1d1d,stroke:#ef4444,color:#fecaca

execution_path rules:
- This is the ordered sequence of nodes actually visited during execution of this specific input.
- Each entry's "node_id" MUST exactly match a node ID in the Mermaid flowchart.
- "event": ≤10 words describing what happens at this node.
- "line": the line number in the student's code that this node executes (1-indexed).
- "state": current values of tracked variables as short strings (e.g. arrays as "[1,2]", booleans as "true").
  Include both direct variables AND derived/indexed values being used at this step.
  Example: if comparing s[i] and s[j], state should include: {"i": "0", "j": "5", "s[i]": "a", "s[j]": "b", "s": "[a,b,c,d,e,f]"}
- "highlight":
    "normal"  — regular execution step
    "error"   — the node where the code does something wrong / diverges from expected
    "success" — the final correct-output node (use only if no error, i.e. test passes)
- Include every node visit in execution order, including repeated visits (e.g. loop back nodes).
- The same node_id may appear multiple times if the loop revisits it.
- Cap at 20 frames.

CRITICAL — Execution correctness (READ CAREFULLY):
- You MUST simulate the code as a computer would — mechanically, step by step, with zero shortcuts.
- BEFORE outputting ANY decision node result, write out the comparison with actual values in your head:
  - "j < len(s)" with j=3 and len(s)=8 → 3 < 8 → TRUE → continue loop
  - "j < len(s)" with j=8 and len(s)=8 → 8 < 8 → FALSE → exit loop
- NEVER skip iterations. If a loop runs 10 times, you must show those iterations (or summarize middle ones explicitly as "... N iterations ...").
- NEVER jump variable values without showing the intermediate steps that changed them.
- The execution_path "state" must show the ACTUAL variable values at that exact moment — these values must be consistent with what the code computes.
- If at step N you have i=1, j=3, and the next step shows i=7, j=8, you have SKIPPED steps. This is WRONG.
- Each loop iteration must be shown: check condition → body → update → check condition again.
- When a condition check happens, the state must show the values BEING CHECKED, and the next node must be the CORRECT branch based on those actual values.
- Think like a debugger: print(i, j) at every step. Your state values are those prints.

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
