'use client';

import dynamic from 'next/dynamic';
import type { VisualizationData } from '@/app/api/visualize/route';

const AnimatedDiagram = dynamic(() => import('@/components/AnimatedDiagram'), { ssr: false });

type Props = {
  data: VisualizationData;
  passed: boolean;
  expectedOutput: unknown;
  actualOutput: unknown;
  testInput: Record<string, unknown>;
  userCode: string;
};

export default function VisualizationView({ data, passed, expectedOutput, actualOutput, testInput, userCode }: Props) {
  return (
    <div className="mt-3 space-y-3">
      {/* Expected / Got — sourced from real test result, never from AI */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-lg px-3 py-2">
          <span className="text-emerald-500 font-medium uppercase tracking-wider text-[10px]">Expected</span>
          <p className="font-mono text-emerald-300 mt-0.5">{JSON.stringify(expectedOutput)}</p>
        </div>
        <div className={`border rounded-lg px-3 py-2 ${
          passed ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-rose-900/20 border-rose-800/50'
        }`}>
          <span className={`font-medium uppercase tracking-wider text-[10px] ${passed ? 'text-emerald-500' : 'text-rose-500'}`}>
            Got
          </span>
          <p className={`font-mono mt-0.5 ${passed ? 'text-emerald-300' : 'text-rose-300'}`}>
            {JSON.stringify(actualOutput)}
          </p>
        </div>
      </div>

      {/* Bug cause banner — only when failing */}
      {!passed && (
        <div className="flex gap-2.5 bg-amber-900/20 border border-amber-800/40 rounded-xl px-3 py-2.5">
          <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-amber-200 text-xs leading-relaxed">{data.summary.high_level_cause}</p>
            {data.summary.bug_location.line > 0 && (
              <p className="text-amber-400/70 text-[11px] mt-0.5">
                Line {data.summary.bug_location.line}: {data.summary.bug_location.reason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Animated diagram */}
      <AnimatedDiagram
        code={data.mermaid.flowchart}
        path={data.execution_path ?? []}
        userCode={userCode}
        testInput={testInput}
        expectedOutput={expectedOutput}
      />
    </div>
  );
}
