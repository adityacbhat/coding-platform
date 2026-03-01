import { getProblemBySlug } from '@/lib/queries';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import ProblemClient from '@/components/ProblemClient';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = await getProblemBySlug(slug);

  if (!problem) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let savedCode: string | null = null;
  let savedAnalysis: Record<string, unknown> | null = null;
  let savedResults: Record<string, unknown> | null = null;

  if (user) {
    const progress = await prisma.userProgress.findUnique({
      where: { userId_problemId: { userId: user.id, problemId: problem.id } },
      select: { lastCode: true, lastAnalysis: true, lastResults: true },
    });
    savedCode = progress?.lastCode ?? null;
    savedAnalysis = (progress?.lastAnalysis as Record<string, unknown>) ?? null;
    savedResults = (progress?.lastResults as Record<string, unknown>) ?? null;
  }

  return <ProblemClient problem={problem} savedCode={savedCode} savedAnalysis={savedAnalysis} savedResults={savedResults} />;
}
