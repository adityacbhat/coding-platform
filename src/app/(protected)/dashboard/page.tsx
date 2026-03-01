import { createClient } from '@/lib/supabase/server';
import { getUserDashboardStats, getUserActivity } from '@/lib/queries';
import { prisma } from '@/lib/db';
import ActivityCalendar from '@/components/ActivityCalendar';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({ where: { email: user.email! } })
    : null;

  const [stats, activityData] = dbUser
    ? await Promise.all([
        getUserDashboardStats(dbUser.id),
        getUserActivity(dbUser.id),
      ])
    : [
        { solved: 0, totalProblems: 0, solvedByDifficulty: { Easy: 0, Medium: 0, Hard: 0 } },
        [],
      ];

  const solvedPercent =
    stats.totalProblems > 0 ? Math.round((stats.solved / stats.totalProblems) * 100) : 0;

  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (solvedPercent / 100) * circumference;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-slate-400 text-sm">Track your coding progress.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#1e293b"
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="url(#progressGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center -mt-2">
            <div className="text-4xl font-bold text-white">{stats.solved}</div>
            <div className="text-sm text-slate-400">Problems Solved</div>
            <div className="text-xs text-slate-500 mt-1">{solvedPercent}% of total</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="text-sm text-slate-400 mb-4 font-medium">By Difficulty</div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-emerald-400">Easy</span>
                <span className="text-slate-300 font-medium">{stats.solvedByDifficulty.Easy}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${stats.solvedByDifficulty.Easy > 0 ? (stats.solvedByDifficulty.Easy / Math.max(stats.solved, 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-amber-400">Medium</span>
                <span className="text-slate-300 font-medium">{stats.solvedByDifficulty.Medium}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${stats.solvedByDifficulty.Medium > 0 ? (stats.solvedByDifficulty.Medium / Math.max(stats.solved, 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-rose-400">Hard</span>
                <span className="text-slate-300 font-medium">{stats.solvedByDifficulty.Hard}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-700"
                  style={{ width: `${stats.solvedByDifficulty.Hard > 0 ? (stats.solvedByDifficulty.Hard / Math.max(stats.solved, 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center gap-1">
          <div className="text-5xl font-bold text-white">{stats.totalProblems}</div>
          <div className="text-sm text-slate-400">Total Problems</div>
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-emerald-400">
                {stats.solvedByDifficulty.Easy}
              </div>
              <div className="text-xs text-slate-500">Easy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-400">
                {stats.solvedByDifficulty.Medium}
              </div>
              <div className="text-xs text-slate-500">Medium</div>
            </div>
            <div>
              <div className="text-lg font-bold text-rose-400">
                {stats.solvedByDifficulty.Hard}
              </div>
              <div className="text-xs text-slate-500">Hard</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-6">Activity</h2>
        <ActivityCalendar activityData={activityData} />
      </div>
    </div>
  );
}
