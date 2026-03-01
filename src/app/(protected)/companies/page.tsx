import { getCompanies } from '@/lib/queries';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Company Specific Questions</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {companies.map((company) => (
          <Link key={company.slug} href={`/companies/${company.slug}`} className="block group">
            <div className="soft-card p-6 rounded-2xl hover:border-violet-300/40 hover:shadow-md transition-all h-full card-hover">
              <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{company.name}</h2>
              <p className="text-slate-500">{company.problemCount ?? 0} Problems</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
