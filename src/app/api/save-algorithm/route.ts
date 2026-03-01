import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const { algorithm, problemSlug } = await request.json();

  const problem = await prisma.problem.findUnique({
    where: { slug: problemSlug },
    select: { id: true },
  });

  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: true });
  }

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email! },
  });

  await prisma.userProgress.upsert({
    where: { userId_problemId: { userId: user.id, problemId: problem.id } },
    update: { lastAlgorithm: algorithm ?? '' },
    create: {
      userId: user.id,
      problemId: problem.id,
      lastAlgorithm: algorithm ?? '',
    },
  });

  return NextResponse.json({ success: true });
}
