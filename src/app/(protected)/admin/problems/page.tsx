import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { getAdminProblems } from '@/lib/queries';
import AdminProblemsTable from '@/components/admin/AdminProblemsTable';

export default async function AdminProblemsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) redirect('/dashboard');

  const problems = await getAdminProblems();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text mb-1">Problems</h1>
          <p className="text-sm text-slate-400">{problems.length} problems in the database</p>
        </div>
      </div>
      <AdminProblemsTable problems={problems} />
    </div>
  );
}
