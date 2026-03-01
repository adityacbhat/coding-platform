import { getCompanyBySlug, getProblemsByCompany } from '@/lib/queries';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

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
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <Link href="/companies" className="text-indigo-400 hover:text-indigo-300 text-sm mb-4 inline-block font-medium">&larr; Back to Companies</Link>
        <h1 className="text-4xl font-bold text-slate-100 mb-2">{company.name}</h1>
        <p className="text-xl text-slate-500">{problems.length} problems asked in interviews</p>
      </div>

      <div className="grid grid-cols-3 gap-4 stagger-children">
        <div className="soft-card p-4 rounded-2xl text-center shadow-sm card-hover">
          <div className="text-2xl font-bold text-emerald-600">{difficultyCount.Easy}</div>
          <div className="text-sm text-slate-500">Easy</div>
        </div>
        <div className="soft-card p-4 rounded-2xl text-center shadow-sm card-hover">
          <div className="text-2xl font-bold text-amber-600">{difficultyCount.Medium}</div>
          <div className="text-sm text-slate-500">Medium</div>
        </div>
        <div className="soft-card p-4 rounded-2xl text-center shadow-sm card-hover">
          <div className="text-2xl font-bold text-rose-600">{difficultyCount.Hard}</div>
          <div className="text-sm text-slate-500">Hard</div>
        </div>
      </div>

      {problems.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">Problems</h2>
          <div className="soft-card rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/60 text-xs uppercase text-slate-500 font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Difficulty</th>
                  <th className="px-6 py-3">Concepts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {problems.map((problem) => (
                  <tr key={problem.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/problems/${problem.slug}`} className="text-slate-300 hover:text-indigo-400 transition-colors font-medium">
                        {problem.title}
                      </Link>
                    </td>
                    <td className={`px-6 py-4 font-medium ${
                      problem.difficulty === 'Easy' ? 'text-emerald-600' :
                      problem.difficulty === 'Medium' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {problem.difficulty}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {problem.concepts.map((concept) => (
                          <span key={concept.slug} className="text-xs bg-slate-700 px-2 py-0.5 rounded-lg text-slate-300 font-medium">
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
        <div className="soft-card p-8 rounded-2xl text-center shadow-sm">
          <p className="text-slate-500">No problems added yet for {company.name}.</p>
        </div>
      )}
    </div>
  );
}
