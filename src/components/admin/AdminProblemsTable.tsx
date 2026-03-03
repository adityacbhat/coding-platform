'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type AdminProblemRow = {
  id: number;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  frequency: number | null;
  acceptance: number | null;
  testCaseCount: number;
  concepts: { slug: string; title: string }[];
  companies: { slug: string; name: string }[];
};

const difficultyColor = {
  Easy: 'text-emerald-400 bg-emerald-400/10',
  Medium: 'text-amber-400 bg-amber-400/10',
  Hard: 'text-red-400 bg-red-400/10',
};

type SortKey = 'id' | 'title' | 'difficulty' | 'frequency' | 'acceptance' | 'testCaseCount';

export default function AdminProblemsTable({ problems }: { problems: AdminProblemRow[] }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return problems
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.concepts.some((c) => c.title.toLowerCase().includes(q)) ||
          p.companies.some((c) => c.name.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        const aVal = a[sortKey] ?? 0;
        const bVal = b[sortKey] ?? 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      });
  }, [problems, search, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-slate-500">
      {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search problems, tags, companies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} problems</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/60">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 w-14" onClick={() => handleSort('id')}>
                ID <SortIcon col="id" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200" onClick={() => handleSort('title')}>
                Title <SortIcon col="title" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 w-24" onClick={() => handleSort('difficulty')}>
                Diff <SortIcon col="difficulty" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 w-24" onClick={() => handleSort('frequency')}>
                Freq % <SortIcon col="frequency" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 w-24" onClick={() => handleSort('acceptance')}>
                Acc % <SortIcon col="acceptance" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Concepts
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Companies
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 w-24" onClick={() => handleSort('testCaseCount')}>
                Tests <SortIcon col="testCaseCount" />
              </th>
              <th className="px-4 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filtered.map((problem) => (
              <tr key={problem.id} className="hover:bg-slate-800/40 transition-colors group">
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{problem.id}</td>
                <td className="px-4 py-3">
                  <div>
                    <span className="text-slate-200 font-medium">{problem.title}</span>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{problem.slug}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${difficultyColor[problem.difficulty]}`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300 tabular-nums">
                  {problem.frequency != null ? `${problem.frequency.toFixed(1)}%` : '—'}
                </td>
                <td className="px-4 py-3 text-slate-300 tabular-nums">
                  {problem.acceptance != null ? `${problem.acceptance.toFixed(1)}%` : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {problem.concepts.slice(0, 3).map((c) => (
                      <span key={c.slug} className="px-1.5 py-0.5 rounded-md text-[10px] bg-violet-500/15 text-violet-300 border border-violet-500/20">
                        {c.title}
                      </span>
                    ))}
                    {problem.concepts.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] text-slate-500">
                        +{problem.concepts.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {problem.companies.slice(0, 3).map((c) => (
                      <span key={c.slug} className="px-1.5 py-0.5 rounded-md text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/20">
                        {c.name}
                      </span>
                    ))}
                    {problem.companies.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] text-slate-500">
                        +{problem.companies.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300 tabular-nums text-center">{problem.testCaseCount}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/problems/${problem.slug}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                  No problems match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
