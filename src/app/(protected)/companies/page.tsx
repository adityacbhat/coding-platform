import { getCompanies } from '@/lib/queries';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white">Company Specific Questions</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Link key={company.slug} href={`/companies/${company.slug}`} className="block group">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-blue-500 transition-colors h-full">
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{company.name}</h2>
              <p className="text-slate-400">{company.problemCount ?? 0} Problems</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
