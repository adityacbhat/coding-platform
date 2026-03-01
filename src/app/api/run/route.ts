import { NextRequest, NextResponse } from 'next/server';

const WANDBOX_API = 'https://wandbox.org/api/compile.json';

const WANDBOX_COMPILER: Record<string, string> = {
  python: 'cpython-3.12.7',
  javascript: 'nodejs-20.17.0',
};

export async function POST(request: NextRequest) {
  const { code, language } = await request.json();

  if (language !== 'python' && language !== 'javascript') {
    return NextResponse.json(
      { error: 'Only Python and JavaScript are supported.' },
      { status: 400 }
    );
  }

  const response = await fetch(WANDBOX_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compiler: WANDBOX_COMPILER[language],
      code,
    }),
  });

  const data = await response.json();

  const stdout: string = data.program_output ?? '';
  const stderr: string = data.program_error ?? data.compiler_error ?? '';

  return NextResponse.json({ output: stdout, error: stderr || null });
}
