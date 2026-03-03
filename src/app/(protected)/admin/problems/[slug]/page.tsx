import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { getAdminProblemBySlug, getConcepts, getCompanies } from '@/lib/queries';
import AdminProblemEditor from '@/components/admin/AdminProblemEditor';

export default async function AdminProblemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) redirect('/dashboard');

  const { slug } = await params;

  const [problem, concepts, companies] = await Promise.all([
    getAdminProblemBySlug(slug),
    getConcepts(),
    getCompanies(),
  ]);

  if (!problem) notFound();

  const allConcepts = concepts.map((c) => ({ id: c.id, slug: c.slug, title: c.title }));
  const allCompanies = companies.map((c) => ({ id: c.id, slug: c.slug, name: c.name }));

  return (
    <AdminProblemEditor
      problem={problem}
      allConcepts={allConcepts}
      allCompanies={allCompanies}
    />
  );
}
