import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const problemId = parseInt(id);
  const body = await request.json();

  const {
    title,
    slug,
    difficulty,
    description,
    starterCodePython,
    starterCodeJs,
    constraints,
    hints,
    frequency,
    acceptance,
    conceptIds,
    companyIds,
  } = body;

  await prisma.$transaction(async (tx) => {
    await tx.problem.update({
      where: { id: problemId },
      data: {
        title,
        slug,
        difficulty,
        description,
        starterCodePython,
        starterCodeJs: starterCodeJs || null,
        constraints: constraints ?? null,
        hints: hints ?? null,
        frequency: frequency ?? null,
        acceptance: acceptance ?? null,
      },
    });

    if (conceptIds !== undefined) {
      await tx.problemConcept.deleteMany({ where: { problemId } });
      if (conceptIds.length > 0) {
        await tx.problemConcept.createMany({
          data: conceptIds.map((conceptId: number) => ({ problemId, conceptId })),
        });
      }
    }

    if (companyIds !== undefined) {
      await tx.problemCompany.deleteMany({ where: { problemId } });
      if (companyIds.length > 0) {
        await tx.problemCompany.createMany({
          data: companyIds.map((companyId: number) => ({ problemId, companyId })),
        });
      }
    }
  });

  return NextResponse.json({ success: true });
}
