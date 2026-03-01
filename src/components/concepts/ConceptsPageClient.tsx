'use client';

import dynamic from 'next/dynamic';

const RoadmapDiagram = dynamic(
  () => import('./RoadmapDiagram'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[700px] bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
          Loading roadmap...
        </div>
      </div>
    ),
  }
);

export default function ConceptsPageClient() {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          DSA Learning Roadmap
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Master data structures and algorithms through pattern recognition, not memorization.
          Click any concept to explore its patterns and practice problems.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-indigo-600 border border-indigo-500" />
          <span className="text-slate-500">Has content</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200" />
          <span className="text-slate-500">Coming soon</span>
        </div>
      </div>

      <RoadmapDiagram />

      <div className="mt-10 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-3">How to use this roadmap</h3>
        <ul className="space-y-2 text-slate-500 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">1.</span>
            <span>Start from the top with <strong className="text-slate-700">General Concepts</strong> - Python syntax and built-ins, then <strong className="text-slate-700">Arrays & Hashing</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">2.</span>
            <span>Follow the connections down - each concept builds on prerequisites above it</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">3.</span>
            <span>Click a concept to learn its patterns and recognition cues</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">4.</span>
            <span>Focus on <strong className="text-slate-700">recognizing when</strong> to use a pattern, not memorizing solutions</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
