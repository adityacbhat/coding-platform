import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

const WANDBOX_API = 'https://wandbox.org/api/compile.json';

const WANDBOX_COMPILER: Record<string, string> = {
  python: 'cpython-3.12.7',
  javascript: 'nodejs-20.17.0',
};

type TestResult = {
  testCaseId: number;
  passed: boolean;
  input: Record<string, unknown>;
  expected: unknown;
  actual: unknown;
  error?: string;
};

export async function POST(request: NextRequest) {
  const { code, language, problemSlug, runHidden = false } = await request.json();

  if (language !== 'python' && language !== 'javascript') {
    return NextResponse.json(
      { error: 'Only Python and JavaScript are supported.' },
      { status: 400 }
    );
  }

  const problem = await prisma.problem.findUnique({
    where: { slug: problemSlug },
    include: {
      testCases: {
        where: runHidden ? {} : { isHidden: false },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  const results: TestResult[] = [];
  let allPassed = true;

  for (const testCase of problem.testCases) {
    const result = await runTestCase(code, language, testCase.input as Record<string, unknown>, testCase.expectedOutput);

    results.push({
      testCaseId: testCase.id,
      passed: result.passed,
      input: testCase.input as Record<string, unknown>,
      expected: testCase.expectedOutput,
      actual: result.actual,
      error: result.error,
    });

    if (!result.passed) allPassed = false;
  }

  // Persist progress for authenticated users
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Ensure user row exists in our custom users table (synced from Supabase Auth)
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email! },
    });

    const existing = await prisma.userProgress.findUnique({
      where: { userId_problemId: { userId: user.id, problemId: problem.id } },
    });

    // Determine new status: only upgrade to 'solved' if all passed, never downgrade from 'solved'
    const newStatus = allPassed ? 'solved' : (existing?.status === 'solved' ? 'solved' : 'attempted');

    // Always save the latest code, but preserve solved status and solvedAt if already solved
    await prisma.userProgress.upsert({
      where: { userId_problemId: { userId: user.id, problemId: problem.id } },
      update: {
        status: newStatus,
        lastCode: code,  // Always update to latest code
        solvedAt: allPassed ? new Date() : existing?.solvedAt ?? null,
      },
      create: {
        userId: user.id,
        problemId: problem.id,
        status: newStatus,
        lastCode: code,
        solvedAt: allPassed ? new Date() : null,
      },
    });

    const resultsPayload = JSON.stringify({
      success: allPassed,
      results,
      totalTests: problem.testCases.length,
      passedTests: results.filter((r) => r.passed).length,
    });

    await prisma.$executeRaw`
      UPDATE user_progress
      SET last_results = ${resultsPayload}::jsonb
      WHERE user_id = ${user.id} AND problem_id = ${problem.id}
    `;

    // Save full submission record only on submit (hidden test cases)
    if (runHidden) {
      await prisma.submission.create({
        data: {
          userId: user.id,
          problemId: problem.id,
          code,
          language,
          result: allPassed ? 'accepted' : 'wrong_answer',
          testResults: JSON.parse(JSON.stringify(results)),
        },
      });
    }
  }

  return NextResponse.json({
    success: allPassed,
    results,
    totalTests: problem.testCases.length,
    passedTests: results.filter((r) => r.passed).length,
  });
}

async function runTestCase(
  code: string,
  language: string,
  input: Record<string, unknown>,
  expectedOutput: unknown
): Promise<{ passed: boolean; actual: unknown; error?: string }> {
  const wrappedCode = wrapCodeWithTestRunner(code, language, input);

  const response = await fetch(WANDBOX_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compiler: WANDBOX_COMPILER[language],
      code: wrappedCode,
    }),
  });

  const data = await response.json();

  const stdout: string = data.program_output ?? '';
  const stderr: string = data.program_error ?? data.compiler_error ?? '';
  const exitCode: number = Number(data.status ?? 0);

  if (exitCode !== 0 || stderr) {
    return { passed: false, actual: null, error: stderr || 'Runtime error' };
  }

  const actualOutput = parseOutput(stdout.trim());
  const passed = compareOutputs(actualOutput, expectedOutput);

  return { passed, actual: actualOutput };
}

function wrapCodeWithTestRunner(code: string, language: string, input: Record<string, unknown>): string {
  if (language === 'python') {
    const inputSetup = Object.entries(input)
      .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
      .join('\n');

    const solutionCall = generatePythonSolutionCall(code, input);

    return `
import json
from typing import List, Optional

${code}

${inputSetup}

sol = Solution()
result = ${solutionCall}
print(json.dumps(result))
`;
  } else {
    const inputSetup = Object.entries(input)
      .map(([key, value]) => `const ${key} = ${JSON.stringify(value)};`)
      .join('\n');

    const solutionCall = generateJsSolutionCall(code, input);

    return `
${code}

${inputSetup}

const result = ${solutionCall};
console.log(JSON.stringify(result));
`;
  }
}

function generatePythonSolutionCall(code: string, input: Record<string, unknown>): string {
  const methodMatch = code.match(/def\s+(\w+)\s*\(\s*self/);
  if (methodMatch) {
    const methodName = methodMatch[1];
    const args = Object.keys(input).join(', ');
    return `sol.${methodName}(${args})`;
  }
  return 'None';
}

function generateJsSolutionCall(code: string, input: Record<string, unknown>): string {
  const funcMatch = code.match(/(?:var|const|function)\s+(\w+)\s*(?:=\s*function)?\s*\(/);
  if (funcMatch) {
    const funcName = funcMatch[1];
    const args = Object.keys(input).join(', ');
    return `${funcName}(${args})`;
  }
  return 'null';
}

function parseOutput(output: string): unknown {
  try {
    return JSON.parse(output);
  } catch {
    return output;
  }
}

function compareOutputs(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;
    return actual.every((val, idx) => compareOutputs(val, expected[idx]));
  }

  if (typeof actual === 'number' && typeof expected === 'number') {
    return Math.abs(actual - expected) < 0.00001;
  }

  return JSON.stringify(actual) === JSON.stringify(expected);
}
