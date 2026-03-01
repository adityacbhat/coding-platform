'use client';

import { useState, useEffect } from 'react';
import type { Concept, Company, Difficulty } from '@/lib/types';

type Props = {
  concepts: Pick<Concept, 'slug' | 'title'>[];
  companies: Pick<Company, 'slug' | 'name'>[];
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
};

export type FilterState = {
  difficulty: Difficulty[];
  concepts: string[];
  companies: string[];
  search: string;
};

export default function ProblemFilters({ concepts, companies, onFilterChange, initialFilters }: Props) {
  const [filters, setFilters] = useState<FilterState>(initialFilters || {
    difficulty: [],
    concepts: [],
    companies: [],
    search: '',
  });

  const [isConceptsExpanded, setIsConceptsExpanded] = useState(false);
  const [isCompaniesExpanded, setIsCompaniesExpanded] = useState(false);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const toggleDifficulty = (diff: Difficulty) => {
    setFilters((prev) => ({
      ...prev,
      difficulty: prev.difficulty.includes(diff)
        ? prev.difficulty.filter((d) => d !== diff)
        : [...prev.difficulty, diff],
    }));
  };

  const toggleConcept = (slug: string) => {
    setFilters((prev) => ({
      ...prev,
      concepts: prev.concepts.includes(slug)
        ? prev.concepts.filter((c) => c !== slug)
        : [...prev.concepts, slug],
    }));
  };

  const toggleCompany = (slug: string) => {
    setFilters((prev) => ({
      ...prev,
      companies: prev.companies.includes(slug)
        ? prev.companies.filter((c) => c !== slug)
        : [...prev.companies, slug],
    }));
  };

  const clearFilters = () => {
    setFilters({
      difficulty: [],
      concepts: [],
      companies: [],
      search: '',
    });
  };

  const hasActiveFilters = 
    filters.difficulty.length > 0 || 
    filters.concepts.length > 0 || 
    filters.companies.length > 0 ||
    filters.search.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <input
          type="text"
          placeholder="Search problems..."
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          className="w-full bg-white/40 border border-violet-200/30 rounded-xl px-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition"
        />
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Clear all filters
        </button>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Difficulty</h3>
        <div className="space-y-2">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((diff) => (
            <label key={diff} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.difficulty.includes(diff)}
                onChange={() => toggleDifficulty(diff)}
                className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
              />
              <span className={`text-sm font-medium ${
                diff === 'Easy' ? 'text-emerald-600' :
                diff === 'Medium' ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {diff}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <button
          onClick={() => setIsConceptsExpanded(!isConceptsExpanded)}
          className="flex items-center justify-between w-full text-sm font-semibold text-slate-700 mb-3 hover:text-indigo-600 transition-colors"
        >
          <span>Concepts {filters.concepts.length > 0 && `(${filters.concepts.length})`}</span>
          <span className="text-slate-400">{isConceptsExpanded ? '−' : '+'}</span>
        </button>
        {isConceptsExpanded && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {concepts.map((concept) => (
              <label key={concept.slug} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.concepts.includes(concept.slug)}
                  onChange={() => toggleConcept(concept.slug)}
                  className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <span className="text-sm text-slate-600">{concept.title}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <button
          onClick={() => setIsCompaniesExpanded(!isCompaniesExpanded)}
          className="flex items-center justify-between w-full text-sm font-semibold text-slate-700 mb-3 hover:text-indigo-600 transition-colors"
        >
          <span>Companies {filters.companies.length > 0 && `(${filters.companies.length})`}</span>
          <span className="text-slate-400">{isCompaniesExpanded ? '−' : '+'}</span>
        </button>
        {isCompaniesExpanded && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {companies.map((company) => (
              <label key={company.slug} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.companies.includes(company.slug)}
                  onChange={() => toggleCompany(company.slug)}
                  className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <span className="text-sm text-slate-600">{company.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
