import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { problemId, input, expectedOutput, isHidden, orderIndex } = await request.json();

  const testCase = await prisma.testCase.create({
    data: {
      problemId,
      input,
      expectedOutput,
      isHidden: isHidden ?? false,
      orderIndex: orderIndex ?? 0,
    },
  });

  return NextResponse.json(testCase);
}
