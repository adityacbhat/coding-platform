import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';
import { getStats } from '@/lib/queries';
import Link from 'next/link';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) redirect('/dashboard');

  const stats = await getStats();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Admin Panel</h1>
        <p className="text-slate-400">Manage platform content and settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/problems" className="soft-card p-6 rounded-2xl border border-slate-700 hover:border-amber-500/40 transition-colors group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Problems</h2>
              <p className="text-xs text-slate-500">{stats.totalProblems} total · {stats.byDifficulty.Easy}E / {stats.byDifficulty.Medium}M / {stats.byDifficulty.Hard}H</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">View, edit, and manage coding problems, test cases, and metadata.</p>
          <div className="mt-3 flex items-center gap-1 text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Manage problems <span>→</span>
          </div>
        </Link>

        <div className="soft-card p-6 rounded-2xl border border-slate-700 opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Concepts</h2>
              <p className="text-xs text-slate-500">{stats.totalConcepts} total</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Manage learning concepts and educational content.</p>
          <p className="mt-3 text-xs text-slate-600">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
