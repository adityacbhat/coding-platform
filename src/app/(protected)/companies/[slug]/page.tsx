import { getCompanyBySlug, getProblemsByCompany } from '@/lib/queries';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [company, problems] = await Promise.all([
    getCompanyBySlug(slug),
    getProblemsByCompany(slug),
  ]);

  if (!company) {
    notFound();
  }

  const difficultyCount = {
    Easy: problems.filter((p) => p.difficulty === 'Easy').length,
    Medium: problems.filter((p) => p.difficulty === 'Medium').length,
    Hard: problems.filter((p) => p.difficulty === 'Hard').length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link href="/companies" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">&larr; Back to Companies</Link>
        <h1 className="text-4xl font-bold text-white mb-2">{company.name}</h1>
        <p className="text-xl text-slate-400">{problems.length} problems asked in interviews</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-emerald-400">{difficultyCount.Easy}</div>
          <div className="text-sm text-slate-400">Easy</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-amber-400">{difficultyCount.Medium}</div>
          <div className="text-sm text-slate-400">Medium</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-rose-400">{difficultyCount.Hard}</div>
          <div className="text-sm text-slate-400">Hard</div>
        </div>
      </div>

      {problems.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Problems</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Difficulty</th>
                  <th className="px-6 py-3">Concepts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {problems.map((problem) => (
                  <tr key={problem.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/problems/${problem.slug}`} className="text-slate-200 hover:text-blue-400 transition-colors">
                        {problem.title}
                      </Link>
                    </td>
                    <td className={`px-6 py-4 ${
                      problem.difficulty === 'Easy' ? 'text-emerald-400' :
                      problem.difficulty === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {problem.difficulty}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {problem.concepts.map((concept) => (
                          <span key={concept.slug} className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                            {concept.title}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center">
          <p className="text-slate-400">No problems added yet for {company.name}.</p>
        </div>
      )}
    </div>
  );
}
