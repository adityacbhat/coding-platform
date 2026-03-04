import { NextRequest, NextResponse } from 'next/server';

const WANDBOX_API = 'https://wandbox.org/api/compile.json';
const WANDBOX_COMPILER: Record<string, string> = {
  python: 'cpython-3.12.7',
  javascript: 'nodejs-20.17.0',
};

const PYTHON_EXEC_SERVER_URL = (process.env.PYTHON_EXEC_SERVER_URL ?? '').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  const { code, language } = await request.json();

  if (language !== 'python' && language !== 'javascript') {
    return NextResponse.json(
      { error: 'Only Python and JavaScript are supported.' },
      { status: 400 }
    );
  }

  if (language === 'python' && PYTHON_EXEC_SERVER_URL) {
    try {
      const res = await fetch(`${PYTHON_EXEC_SERVER_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ output: data.stdout ?? '', error: data.stderr || null });
      }
    } catch {
      // local server is down — fall through to Wandbox
    }
  }

  const res = await fetch(WANDBOX_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ compiler: WANDBOX_COMPILER[language], code }),
  });
  const data = await res.json();
  return NextResponse.json({
    output: data.program_output ?? '',
    error: data.program_error ?? data.compiler_error ?? null,
  });
}
