import { NextRequest, NextResponse } from 'next/server';
import { jsonrepair } from 'jsonrepair';
import { prisma } from '@/lib/db';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

type OpenRouterResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

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

  const prompt = `You are a "Debug Visualizer" that outputs ONLY machine-checkable JSON artifacts, not prose.

Context:
Problem: ${problem.title}
${problem.description}

Student code (${language}):
\`\`\`${language}
${code}
\`\`\`

Single test case:
- Input: ${JSON.stringify(input)}
- Expected output: ${JSON.stringify(expectedOutput)}

Goal:
Produce a step-by-step execution trace, a Mermaid flowchart, and an execution_path for THIS exact input that make the bug visually obvious.

ABSOLUTE REQUIREMENTS (read carefully):
1) Mechanical simulation only:
   - Simulate the code like a debugger would: evaluate every condition using the current concrete values.
   - Never "assume" loop behavior. Never jump values. Never compress unless explicitly using the loop summarization rule below.

2) Consistency across artifacts:
   - The final returned value implied by the trace MUST match the final "actual" value in checkpoints.
   - execution_path state MUST be consistent with steps (same variable values at same moment).
   - Node IDs in execution_path MUST exist in the Mermaid flowchart.
   - Line numbers are 1-indexed lines of the student's code block above.

3) What to trace:
   - Track only 2–4 core variables/structures that drive the result.
   - ALSO track any derived/indexed values used in comparisons or indexing (example: if comparing s[i] and s[j], include s[i] and s[j] in tracked and in state).

4) Steps:
   - Each trace step = one meaningful operation (one condition check, one compare, one pointer update, one longest update, one return).
   - event must be 10 words or fewer.
   - Show ALL iterations of the loop - do NOT skip or summarize any steps.
   - Include every single step from start to finish.

5) Divergence definition:
   - first_divergence_step is the earliest step where the algorithm's behavior becomes incorrect relative to the problem's intended semantics.
   - If the student's output differs from expectedOutput, there MUST be a divergence step (not -1).
   - The frame in execution_path with highlight="error" MUST correspond to that divergence point.

Mermaid flowchart rules (CRITICAL — every violation causes render failure):
- Start with exactly: flowchart TD
- Node IDs: simple alphanumeric only (A, B, loopCheck, step1). No spaces, hyphens, punctuation.
- ALWAYS wrap every node label in double quotes:
  - A["label"], B{"label"}, C("label")
- Never place any of these characters INSIDE label text (they break Mermaid parsing):
  square brackets, curly braces, pipe, angle brackets, double quote, hash, ampersand, semicolon
  Rephrase labels to avoid them entirely.
- Edges: use --> and optional labels with |text| on the arrow: A -->|Yes| B
- Use as many nodes as needed to represent the algorithm clearly.
- Show key decisions and the divergence point.
- Mark the error node with:
  style errorNodeId fill:#7f1d1d,stroke:#ef4444,color:#fecaca
- Each node label MUST end with a line reference: " · L{n}"

execution_path rules:
- This is the ordered sequence of nodes actually visited for THIS input.
- Include ALL repeated visits in order (loops revisit nodes). Show the COMPLETE execution path.
- event must be 10 words or fewer.
- line: the line number executed at that node (1-indexed in student's code).
- state: current values of tracked variables as short strings.
  Include both direct variables and derived values used at that moment.
- highlight:
  - "normal" for regular steps,
  - "error" for the first divergence moment,
  - "success" only if there is no divergence (test truly passes).
- Show ALL frames - do NOT skip or summarize any frames.
- The execution_path must match the steps array - every step should have a corresponding frame.

Output format:
Return ONLY raw JSON (no markdown fences, no extra text) that conforms EXACTLY to this schema:

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
}

Final sanity checks you MUST do before responding:
- Compute the student's actual return value from your simulation and place it in checkpoints final "actual".
- Ensure checkpoints final status matches comparison of actual vs expectedOutput.
- Ensure the trace includes the moment longest reaches its final value (if it changes).
- Ensure mermaid node IDs match execution_path node_id values exactly.
`;

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

  const contentText = result.choices[0].message.content;
  const rawText = contentText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const visualization: VisualizationData = JSON.parse(jsonrepair(rawText));

  // Write debug output to file
  const fs = await import('fs');
  const debugOutput = `=== RAW LLM OUTPUT ===
${contentText}

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