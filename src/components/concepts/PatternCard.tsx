'use client';

import { useState } from 'react';
import type { PatternProblem } from '@/lib/concepts-data';

type PatternCardProps = {
  problem: PatternProblem;
  index: number;
};

export default function PatternCard({ problem, index }: PatternCardProps) {
  const [expanded, setExpanded] = useState(false);

  const difficultyColors = {
    Easy: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    Medium: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    Hard: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
  };

  return (
    <div
      className={`
        bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden shadow-sm
        transition-all duration-300 ease-out
        ${expanded ? 'ring-1 ring-indigo-500/50' : ''}
      `}
      style={{
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-slate-500 font-mono text-sm w-6">{index + 1}.</span>
          <div>
            <h4 className="text-lg font-semibold text-slate-100">{problem.title}</h4>
            <span
              className={`text-xs px-2 py-0.5 rounded-lg border mt-1 inline-block font-medium ${difficultyColors[problem.difficulty]}`}
            >
              {problem.difficulty}
            </span>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${expanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-5 pb-5 space-y-5 border-t border-slate-700 pt-5">
          <div>
            <h5 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Explanation
            </h5>
            <p className="text-slate-300 leading-relaxed">{problem.explanation}</p>
          </div>

          {problem.examples && problem.examples.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-purple-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Examples
              </h5>
              <div className="space-y-3">
                {problem.examples.map((example, i) => (
                  <div key={i} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-purple-400 text-xs font-semibold uppercase w-14 flex-shrink-0 pt-0.5">Input:</span>
                        <code className="text-slate-200 font-mono text-sm">{example.input}</code>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 text-xs font-semibold uppercase w-14 flex-shrink-0 pt-0.5">Output:</span>
                        <code className="text-slate-200 font-mono text-sm">{example.output}</code>
                      </div>
                      <div className="flex items-start gap-2 pt-1 border-t border-slate-800/50">
                        <span className="text-slate-500 text-xs pt-1.5">Why:</span>
                        <span className="text-slate-400 text-sm leading-relaxed">{example.explanation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {problem.codeLines && problem.codeLines.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-cyan-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Code Walkthrough
              </h5>
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="divide-y divide-slate-800/50">
                  {problem.codeLines.map((line, i) => (
                    <div key={i} className="flex hover:bg-slate-800/50 transition-colors">
                      <div className="w-10 flex-shrink-0 text-slate-600 text-xs font-mono py-2 px-2 text-right bg-slate-900/50 border-r border-slate-800/50">
                        {i + 1}
                      </div>
                      <div className="flex-1 flex flex-col sm:flex-row">
                        <div className="flex-1 py-2 px-3">
                          <code className="text-cyan-300 font-mono text-sm whitespace-pre">{line.code}</code>
                        </div>
                        <div className="flex-1 py-2 px-3 bg-slate-900/30 border-t sm:border-t-0 sm:border-l border-slate-800/50">
                          <span className="text-slate-400 text-sm">{line.explanation}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <h5 className="text-sm font-semibold text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Recognition Cues
            </h5>
            <div className="flex flex-wrap gap-2">
              {problem.recognitionCues.map((cue, i) => (
                <span
                  key={i}
                  className="text-sm bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30 font-medium"
                >
                  {cue}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <h5 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Core Pattern
            </h5>
            <p className="text-slate-200 font-mono text-sm leading-relaxed">{problem.corePattern}</p>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Mental Checklist
            </h5>
            <ul className="space-y-2">
              {problem.mentalChecklist.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <span className="text-amber-500 mt-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
