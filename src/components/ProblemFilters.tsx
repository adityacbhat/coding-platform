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
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Clear all filters
        </button>
      )}

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Difficulty</h3>
        <div className="space-y-2">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((diff) => (
            <label key={diff} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.difficulty.includes(diff)}
                onChange={() => toggleDifficulty(diff)}
                className="rounded bg-slate-800 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
              />
              <span className={`text-sm ${
                diff === 'Easy' ? 'text-emerald-400' :
                diff === 'Medium' ? 'text-amber-400' : 'text-rose-400'
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
          className="flex items-center justify-between w-full text-sm font-semibold text-white mb-3"
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
                  className="rounded bg-slate-800 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <span className="text-sm text-slate-300">{concept.title}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <button
          onClick={() => setIsCompaniesExpanded(!isCompaniesExpanded)}
          className="flex items-center justify-between w-full text-sm font-semibold text-white mb-3"
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
                  className="rounded bg-slate-800 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <span className="text-sm text-slate-300">{company.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
