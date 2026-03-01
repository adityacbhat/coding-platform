import { getProblems, getConcepts, getCompanies } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import ProblemsClient from '@/components/ProblemsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProblemsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [problems, concepts, companies] = await Promise.all([
    getProblems(),
    getConcepts(),
    getCompanies(),
  ]);

  let progressMap: Record<number, string> = {};

  if (user) {
    const progress = await prisma.userProgress.findMany({
      where: { userId: user.id },
      select: { problemId: true, status: true },
    });
    progressMap = Object.fromEntries(progress.map((p) => [p.problemId, p.status]));
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-slate-100">Practice Problems</h1>
      <ProblemsClient
        initialProblems={problems}
        concepts={concepts.map(c => ({ slug: c.slug, title: c.title }))}
        companies={companies.map(c => ({ slug: c.slug, name: c.name }))}
        progressMap={progressMap}
      />
    </div>
  );
}
