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
    const total = config.easyPercent + config.mediumPercent + config.hardPercent;
    const diff = value - config[key];
    
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (sessionStarted && problems) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl sticky top-4 z-10">
          <div className="text-lg font-semibold text-white">
            Interview Session
          </div>
          <div className={`text-2xl font-mono font-bold ${
            timeRemaining < 300 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {formatTime(timeRemaining)}
          </div>
        </div>

        <div className="space-y-4">
          {problems.map((problem, idx) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.slug}`}
              target="_blank"
              className="block bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-sm font-medium text-slate-300">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white">{problem.title}</div>
                    <div className="flex gap-2 mt-1">
                      {problem.concepts.slice(0, 2).map((c) => (
                        <span key={c.slug} className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                          {c.title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-medium ${
                  problem.difficulty === 'Easy' ? 'bg-emerald-400/10 text-emerald-400' :
                  problem.difficulty === 'Medium' ? 'bg-amber-400/10 text-amber-400' :
                  'bg-rose-400/10 text-rose-400'
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
          className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-medium transition-colors"
        >
          End Session
        </button>
      </div>
    );
  }

  if (problems) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-4">Generated Problems</h2>
          <div className="space-y-3">
            {problems.map((problem, idx) => (
              <div key={problem.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm">{idx + 1}.</span>
                  <span className="text-white">{problem.title}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  problem.difficulty === 'Easy' ? 'bg-emerald-400/10 text-emerald-400' :
                  problem.difficulty === 'Medium' ? 'bg-amber-400/10 text-amber-400' :
                  'bg-rose-400/10 text-rose-400'
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
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Start Session ({config.timeLimit} min)
          </button>
          <button
            onClick={generateProblems}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Regenerate
          </button>
        </div>

        <button
          onClick={() => setProblems(null)}
          className="w-full text-slate-400 hover:text-slate-200 py-2"
        >
          Change Settings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Target Company (Optional)</label>
          <select
            value={config.company}
            onChange={(e) => setConfig((prev) => ({ ...prev, company: e.target.value }))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">Any Company</option>
            {companies.map((company) => (
              <option key={company.slug} value={company.slug}>{company.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Number of Problems: {config.problemCount}
          </label>
          <input
            type="range"
            min="3"
            max="10"
            value={config.problemCount}
            onChange={(e) => setConfig((prev) => ({ ...prev, problemCount: parseInt(e.target.value) }))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>3</span>
            <span>10</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Time Limit: {config.timeLimit} minutes
          </label>
          <input
            type="range"
            min="30"
            max="120"
            step="15"
            value={config.timeLimit}
            onChange={(e) => setConfig((prev) => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>30 min</span>
            <span>120 min</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-4">Difficulty Distribution</label>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800 p-4 rounded-lg text-center">
              <div className="text-emerald-400 text-2xl font-bold">{config.easyPercent}%</div>
              <div className="text-sm text-slate-400">Easy</div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={config.easyPercent}
                onChange={(e) => updateDistribution('easyPercent', parseInt(e.target.value))}
                className="w-full mt-2 accent-emerald-500"
              />
            </div>
            <div className="bg-slate-800 p-4 rounded-lg text-center">
              <div className="text-amber-400 text-2xl font-bold">{config.mediumPercent}%</div>
              <div className="text-sm text-slate-400">Medium</div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={config.mediumPercent}
                onChange={(e) => updateDistribution('mediumPercent', parseInt(e.target.value))}
                className="w-full mt-2 accent-amber-500"
              />
            </div>
            <div className="bg-slate-800 p-4 rounded-lg text-center">
              <div className="text-rose-400 text-2xl font-bold">{config.hardPercent}%</div>
              <div className="text-sm text-slate-400">Hard</div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={config.hardPercent}
                onChange={(e) => updateDistribution('hardPercent', parseInt(e.target.value))}
                className="w-full mt-2 accent-rose-500"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={generateProblems}
        disabled={isGenerating}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-3 rounded-lg font-medium transition-colors"
      >
        {isGenerating ? 'Generating...' : 'Generate Problems'}
      </button>
    </div>
  );
}
