import Link from 'next/link';
import { getStats, getProblems, getConcepts, getCompanies } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [stats, problems, concepts, companies] = await Promise.all([
    getStats(),
    getProblems(),
    getConcepts(),
    getCompanies(),
  ]);

  const recentProblems = problems.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Track your progress and continue practicing.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="text-3xl font-bold text-white">{stats.totalProblems}</div>
          <div className="text-sm text-slate-400">Total Problems</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="text-3xl font-bold text-emerald-400">{stats.byDifficulty.Easy}</div>
          <div className="text-sm text-slate-400">Easy</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="text-3xl font-bold text-amber-400">{stats.byDifficulty.Medium}</div>
          <div className="text-sm text-slate-400">Medium</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="text-3xl font-bold text-rose-400">{stats.byDifficulty.Hard}</div>
          <div className="text-sm text-slate-400">Hard</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link 
              href="/problems" 
              className="flex items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-white">Practice Problems</div>
                  <div className="text-sm text-slate-400">Browse all problems</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link 
              href="/interview" 
              className="flex items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-white">Interview Prep</div>
                  <div className="text-sm text-slate-400">Start a timed practice session</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link 
              href="/concepts" 
              className="flex items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-white">Learn Concepts</div>
                  <div className="text-sm text-slate-400">Study patterns and techniques</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Recent Problems</h2>
            <Link href="/problems" className="text-sm text-blue-400 hover:text-blue-300">View all</Link>
          </div>
          <div className="space-y-2">
            {recentProblems.map((problem) => (
              <Link 
                key={problem.id}
                href={`/problems/${problem.slug}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <span className="text-slate-200 truncate">{problem.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  problem.difficulty === 'Easy' ? 'bg-emerald-400/10 text-emerald-400' :
                  problem.difficulty === 'Medium' ? 'bg-amber-400/10 text-amber-400' :
                  'bg-rose-400/10 text-rose-400'
                }`}>
                  {problem.difficulty}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Concepts</h2>
            <Link href="/concepts" className="text-sm text-blue-400 hover:text-blue-300">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {concepts.slice(0, 4).map((concept) => (
              <Link 
                key={concept.slug}
                href={`/concepts/${concept.slug}`}
                className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="font-medium text-white text-sm">{concept.title}</div>
                <div className="text-xs text-slate-400">{concept.problemCount ?? 0} problems</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Companies</h2>
            <Link href="/companies" className="text-sm text-blue-400 hover:text-blue-300">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {companies.slice(0, 4).map((company) => (
              <Link 
                key={company.slug}
                href={`/companies/${company.slug}`}
                className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="font-medium text-white text-sm">{company.name}</div>
                <div className="text-xs text-slate-400">{company.problemCount ?? 0} problems</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
