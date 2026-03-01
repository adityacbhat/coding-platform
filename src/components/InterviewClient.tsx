'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Company, ProblemListItem } from '@/lib/types';

type Props = {
  companies: Pick<Company, 'slug' | 'name'>[];
};

type InterviewConfig = {
  company: string;
  problemCount: number;
  easyPercent: number;
  mediumPercent: number;
  hardPercent: number;
  timeLimit: number;
};

export default function InterviewClient({ companies }: Props) {
  const [config, setConfig] = useState<InterviewConfig>({
    company: '',
    problemCount: 5,
    easyPercent: 20,
    mediumPercent: 60,
    hardPercent: 20,
    timeLimit: 60,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [problems, setProblems] = useState<ProblemListItem[] | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const generateProblems = async () => {
    setIsGenerating(true);
    
    const params = new URLSearchParams();
    params.set('limit', config.problemCount.toString());
    if (config.company) {
      params.append('company', config.company);
    }

    const response = await fetch(`/api/interview/generate?${params.toString()}`);
    const data = await response.json();
    
    setProblems(data.problems);
    setIsGenerating(false);
  };

  const startSession = () => {
    setSessionStarted(true);
    setTimeRemaining(config.timeLimit * 60);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateDistribution = (key: 'easyPercent' | 'mediumPercent' | 'hardPercent', value: number) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (sessionStarted && problems) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between soft-card p-4 rounded-2xl sticky top-4 z-10 shadow-md">
          <div className="text-lg font-semibold text-slate-100">
            Interview Session
          </div>
          <div className={`text-2xl font-mono font-bold ${
            timeRemaining < 300 ? 'text-rose-500' : 'text-emerald-600'
          }`}>
            {formatTime(timeRemaining)}
          </div>
        </div>

        <div className="space-y-4 stagger-children">
          {problems.map((problem, idx) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.slug}`}
              target="_blank"
              className="block soft-card p-4 rounded-2xl hover:border-indigo-500/50 hover:shadow-md transition-all card-hover"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center text-sm font-medium text-indigo-400">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium text-slate-100">{problem.title}</div>
                    <div className="flex gap-2 mt-1">
                      {problem.concepts.slice(0, 2).map((c) => (
                        <span key={c.slug} className="text-xs bg-slate-700 px-2 py-0.5 rounded-lg text-slate-400">
                          {c.title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  problem.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  problem.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {problem.difficulty}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <button
          onClick={() => {
            setSessionStarted(false);
            setProblems(null);
          }}
          className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-3 rounded-xl font-medium transition-colors"
        >
          End Session
        </button>
      </div>
    );
  }

  if (problems) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="soft-card p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold text-slate-100 mb-4">Generated Problems</h2>
          <div className="space-y-3">
            {problems.map((problem, idx) => (
              <div key={problem.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm">{idx + 1}.</span>
                  <span className="text-slate-100 font-medium">{problem.title}</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                  problem.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                  problem.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-rose-500/20 text-rose-400'
                }`}>
                  {problem.difficulty}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={startSession}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/25"
          >
            Start Session ({config.timeLimit} min)
          </button>
          <button
            onClick={generateProblems}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-medium transition-colors"
          >
            Regenerate
          </button>
        </div>

        <button
          onClick={() => setProblems(null)}
          className="w-full text-slate-500 hover:text-indigo-400 py-2 transition-colors"
        >
          Change Settings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="soft-card p-6 rounded-2xl space-y-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Target Company (Optional)</label>
          <select
            value={config.company}
            onChange={(e) => setConfig((prev) => ({ ...prev, company: e.target.value }))}
            className="w-full bg-slate-800/60 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition"
          >
            <option value="">Any Company</option>
            {companies.map((company) => (
              <option key={company.slug} value={company.slug}>{company.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Number of Problems: <span className="text-indigo-600 font-bold">{config.problemCount}</span>
          </label>
          <input
            type="range"
            min="3"
            max="10"
            value={config.problemCount}
            onChange={(e) => setConfig((prev) => ({ ...prev, problemCount: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>3</span>
            <span>10</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Time Limit: <span className="text-indigo-400 font-bold">{config.timeLimit} minutes</span>
          </label>
          <input
            type="range"
            min="30"
            max="120"
            step="15"
            value={config.timeLimit}
            onChange={(e) => setConfig((prev) => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>30 min</span>
            <span>120 min</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-4">Difficulty Distribution</label>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-xl text-center">
              <div className="text-emerald-400 text-2xl font-bold">{config.easyPercent}%</div>
              <div className="text-sm text-slate-500">Easy</div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={config.easyPercent}
                onChange={(e) => updateDistribution('easyPercent', parseInt(e.target.value))}
                className="w-full mt-2"
              />
            </div>
            <div className="bg-amber-500/20 border border-amber-500/30 p-4 rounded-xl text-center">
              <div className="text-amber-400 text-2xl font-bold">{config.mediumPercent}%</div>
              <div className="text-sm text-slate-500">Medium</div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={config.mediumPercent}
                onChange={(e) => updateDistribution('mediumPercent', parseInt(e.target.value))}
                className="w-full mt-2"
              />
            </div>
            <div className="bg-rose-500/20 border border-rose-500/30 p-4 rounded-xl text-center">
              <div className="text-rose-400 text-2xl font-bold">{config.hardPercent}%</div>
              <div className="text-sm text-slate-500">Hard</div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={config.hardPercent}
                onChange={(e) => updateDistribution('hardPercent', parseInt(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={generateProblems}
        disabled={isGenerating}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/25"
      >
        {isGenerating ? 'Generating...' : 'Generate Problems'}
      </button>
    </div>
  );
}
