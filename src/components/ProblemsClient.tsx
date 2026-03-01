'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import ProblemFilters, { FilterState } from './ProblemFilters';
import type { ProblemListItem, Concept, Company } from '@/lib/types';

type Props = {
  initialProblems: ProblemListItem[];
  concepts: Pick<Concept, 'slug' | 'title'>[];
  companies: Pick<Company, 'slug' | 'name'>[];
  progressMap: Record<number, string>;
};

export default function ProblemsClient({ initialProblems, concepts, companies, progressMap }: Props) {
  const [problems, setProblems] = useState(initialProblems);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const handleFilterChange = useCallback(async (filters: FilterState) => {
    setIsLoading(true);

    const params = new URLSearchParams();
    filters.difficulty.forEach((d) => params.append('difficulty', d));
    filters.concepts.forEach((c) => params.append('concept', c));
    filters.companies.forEach((c) => params.append('company', c));
    if (filters.search) params.set('search', filters.search);

    const response = await fetch(`/api/problems?${params.toString()}`);
    const data = await response.json();
    setProblems(data.problems);
    setIsLoading(false);
  }, []);

  return (
    <div className="flex gap-6">
      <div className={`${showFilters ? 'w-64' : 'w-0'} shrink-0 transition-all duration-300 overflow-hidden`}>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sticky top-4">
          <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
          <ProblemFilters
            concepts={concepts}
            companies={companies}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <span className="text-sm text-slate-400">
            {problems.length} problem{problems.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className={`overflow-x-auto rounded-lg border border-slate-800 ${isLoading ? 'opacity-50' : ''}`}>
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-4 w-12">Status</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4 w-28">Difficulty</th>
                <th className="px-6 py-4">Concepts</th>
                <th className="px-6 py-4">Companies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950">
              {problems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No problems match your filters.
                  </td>
                </tr>
              ) : (
                problems.map((problem) => (
                  <tr key={problem.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 text-center">
                      {progressMap[problem.id] === 'solved' && (
                        <svg className="w-4 h-4 text-emerald-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {progressMap[problem.id] === 'attempted' && (
                        <svg className="w-4 h-4 text-amber-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                          <circle cx="12" cy="12" r="9" strokeWidth={2} />
                        </svg>
                      )}
                      {!progressMap[problem.id] && (
                        <span className="text-slate-700">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      <Link href={`/problems/${problem.slug}`} className="hover:text-blue-400 transition-colors">
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
                        {problem.concepts.slice(0, 2).map((concept) => (
                          <span key={concept.slug} className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                            {concept.title}
                          </span>
                        ))}
                        {problem.concepts.length > 2 && (
                          <span className="text-xs text-slate-500">+{problem.concepts.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {problem.companies.slice(0, 2).map((company) => (
                          <span key={company.slug} className="text-xs bg-blue-900/30 px-2 py-0.5 rounded text-blue-300">
                            {company.name}
                          </span>
                        ))}
                        {problem.companies.length > 2 && (
                          <span className="text-xs text-slate-500">+{problem.companies.length - 2}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
