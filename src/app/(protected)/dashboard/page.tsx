import { createClient } from '@/lib/supabase/server';
import { getUserDashboardStats, getUserActivity } from '@/lib/queries';
import { prisma } from '@/lib/db';
import ActivityCalendar from '@/components/ActivityCalendar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    <div className="space-y-8 max-w-5xl animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-1">Dashboard</h1>
        <p className="text-slate-500 text-sm">Track your coding progress.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 stagger-children">
        <div className="soft-card rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm card-hover">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(139,92,246,0.1)"
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
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center -mt-2">
            <div className="text-4xl font-bold text-slate-800">{stats.solved}</div>
            <div className="text-sm text-slate-500">Problems Solved</div>
            <div className="text-xs text-slate-400 mt-1">{solvedPercent}% of total</div>
          </div>
        </div>

        <div className="soft-card rounded-2xl p-6 flex flex-col justify-between shadow-sm card-hover">
          <div className="text-sm text-slate-500 mb-4 font-medium">By Difficulty</div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-emerald-600 font-medium">Easy</span>
                <span className="text-slate-700 font-medium">{stats.solvedByDifficulty.Easy}</span>
              </div>
                <div className="h-2 bg-violet-100/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${stats.solvedByDifficulty.Easy > 0 ? (stats.solvedByDifficulty.Easy / Math.max(stats.solved, 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-amber-600 font-medium">Medium</span>
                <span className="text-slate-700 font-medium">{stats.solvedByDifficulty.Medium}</span>
              </div>
                <div className="h-2 bg-violet-100/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${stats.solvedByDifficulty.Medium > 0 ? (stats.solvedByDifficulty.Medium / Math.max(stats.solved, 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-rose-600 font-medium">Hard</span>
                <span className="text-slate-700 font-medium">{stats.solvedByDifficulty.Hard}</span>
              </div>
                <div className="h-2 bg-violet-100/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-700"
                  style={{ width: `${stats.solvedByDifficulty.Hard > 0 ? (stats.solvedByDifficulty.Hard / Math.max(stats.solved, 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="soft-card rounded-2xl p-6 flex flex-col justify-center gap-1 shadow-sm card-hover">
          <div className="text-5xl font-bold text-slate-800">{stats.totalProblems}</div>
          <div className="text-sm text-slate-500">Total Problems</div>
          <div className="mt-4 pt-4 border-t border-violet-100/30 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-emerald-600">
                {stats.solvedByDifficulty.Easy}
              </div>
              <div className="text-xs text-slate-400">Easy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600">
                {stats.solvedByDifficulty.Medium}
              </div>
              <div className="text-xs text-slate-400">Medium</div>
            </div>
            <div>
              <div className="text-lg font-bold text-rose-600">
                {stats.solvedByDifficulty.Hard}
              </div>
              <div className="text-xs text-slate-400">Hard</div>
            </div>
          </div>
        </div>
      </div>

      <div className="soft-card rounded-2xl p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <h2 className="text-lg font-bold text-slate-800 mb-6">Activity</h2>
        <ActivityCalendar activityData={activityData} />
      </div>
    </div>
  );
}
