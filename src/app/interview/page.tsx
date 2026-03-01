import { getCompanies } from '@/lib/queries';
import InterviewClient from '@/components/InterviewClient';

export const dynamic = 'force-dynamic';

export default async function InterviewPage() {
  const companies = await getCompanies();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Interview Prep Mode</h1>
        <p className="text-slate-400">
          Generate a randomized set of problems to practice for your upcoming interview.
        </p>
      </div>

      <InterviewClient companies={companies.map(c => ({ slug: c.slug, name: c.name }))} />
    </div>
  );
}
