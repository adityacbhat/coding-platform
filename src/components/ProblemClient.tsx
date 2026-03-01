'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import CodeEditor from '@/components/CodeEditor';
import VisualizationView from '@/components/VisualizationView';
import type { Problem, TestResult } from '@/lib/types';
import type { VisualizationData } from '@/app/api/visualize/route';

type Props = {
  problem: Problem;
  savedCode: string | null;
  savedAnalysis: Record<string, unknown> | null;
  savedResults: Record<string, unknown> | null;
};

type ExecuteResult = {
  success: boolean;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
};

type AnalysisData = {
  isOptimal: boolean;
  optimalityExplanation: string;
  timeComplexity: string;
  timeComplexityReason: string;
  spaceComplexity: string;
  spaceComplexityReason: string;
  feedback: string;
};

type AnalysisResult = {
  analysis: AnalysisData;
};

type HintData = {
  area: string;
  hints: string[];
};

export default function ProblemClient({ problem, savedCode, savedAnalysis, savedResults }: Props) {
  const [code, setCode] = useState(savedCode ?? problem.starterCodePython);
  const [language, setLanguage] = useState<'python' | 'javascript'>('python');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  const [isGeneratingPlaycard, setIsGeneratingPlaycard] = useState(false);
  const [playcardToast, setPlaycardToast] = useState(false);
  const [hintResult, setHintResult] = useState<HintData | null>(null);
  const [vizLoading, setVizLoading] = useState<number | null>(null);
  const [vizResults, setVizResults] = useState<Record<number, VisualizationData>>({});
  const [vizErrors, setVizErrors] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'description' | 'testcases' | 'results'>('description');
  const [testResults, setTestResults] = useState<ExecuteResult | null>(
    savedResults ? (savedResults as unknown as ExecuteResult) : null
  );
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    savedAnalysis ? { analysis: savedAnalysis as unknown as AnalysisData } : null
  );

  const handleLanguageChange = (lang: 'python' | 'javascript') => {
    setLanguage(lang);
    if (lang === 'python') {
      setCode(problem.starterCodePython);
    } else if (problem.starterCodeJs) {
      setCode(problem.starterCodeJs);
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setActiveTab('results');
    setOutput('');
    setError('');
    setTestResults(null);

    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        code, 
        language, 
        problemSlug: problem.slug,
        runHidden: false 
      }),
    });

    const data = await response.json();

    if (data.error) {
      setError(data.error);
    } else {
      setTestResults(data);
      setActiveTab('results');
    }
    setIsRunning(false);
  };

  const submitCode = async () => {
    setIsSubmitting(true);
    setActiveTab('results');
    setOutput('');
    setError('');
    setTestResults(null);

    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        code, 
        language, 
        problemSlug: problem.slug,
        runHidden: true 
      }),
    });

    const data = await response.json();

    if (data.error) {
      setError(data.error);
    } else {
      setTestResults(data);
      setActiveTab('results');
      if (data.success) {
        setOutput('All test cases passed! Solution accepted.');
      }
    }
    setIsSubmitting(false);
  };

  const analyzeCode = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        code, 
        language, 
        problemSlug: problem.slug,
        testsPassed: testResults?.success ?? false,
      }),
    });

    const data = await response.json();
    setAnalysisResult(data);
    setIsAnalyzing(false);
  };

  const getHint = async () => {
    setIsHinting(true);
    setHintResult(null);

    const response = await fetch('/api/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        language,
        problemSlug: problem.slug,
        testResults,
      }),
    });

    const data = await response.json();
    setHintResult(data.hint);
    setIsHinting(false);
  };

  const createPlaycard = async () => {
    setIsGeneratingPlaycard(true);
    const firstCase = problem.testCases?.[0];
    await fetch('/api/playcards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemSlug: problem.slug,
        problemTitle: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        concepts: problem.concepts ?? [],
        sampleInput: firstCase?.input ?? {},
        sampleOutput: firstCase?.expectedOutput ?? null,
      }),
    });
    setIsGeneratingPlaycard(false);
    setPlaycardToast(true);
  };

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!playcardToast) return;
    const t = setTimeout(() => setPlaycardToast(false), 6000);
    return () => clearTimeout(t);
  }, [playcardToast]);

  const visualize = async (testCaseId: number, input: Record<string, unknown>, expectedOutput: unknown) => {
    setVizLoading(testCaseId);
    setVizResults((prev) => {
      const next = { ...prev };
      delete next[testCaseId];
      return next;
    });
    setVizErrors((prev) => {
      const next = { ...prev };
      delete next[testCaseId];
      return next;
    });

    const response = await fetch('/api/visualize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, problemSlug: problem.slug, input, expectedOutput }),
    });

    if (!response.ok) {
      setVizErrors((prev) => ({ ...prev, [testCaseId]: 'Visualization failed. Please try again.' }));
      setVizLoading(null);
      return;
    }

    const data = await response.json();

    if (!data.visualization) {
      setVizErrors((prev) => ({ ...prev, [testCaseId]: data.error ?? 'No visualization data returned.' }));
      setVizLoading(null);
      return;
    }

    setVizResults((prev) => ({ ...prev, [testCaseId]: data.visualization }));
    setVizLoading(null);
  };

  const formatTestInput = (input: Record<string, unknown>) => {
    return Object.entries(input)
      .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
      .join('\n');
  };

  // Panel widths as percentages [left, middle, right]
  const [panelWidths, setPanelWidths] = useState([26, 44, 30]);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingDivider = useRef<null | 0 | 1>(null);

  const startResize = useCallback((dividerIndex: 0 | 1) => (e: React.MouseEvent) => {
    e.preventDefault();
    draggingDivider.current = dividerIndex;
    const startX = e.clientX;
    const startWidths = [...panelWidths];

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (draggingDivider.current === null || !containerRef.current) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const deltaPercent = ((moveEvent.clientX - startX) / containerWidth) * 100;

      setPanelWidths((prev) => {
        const next = [...prev];
        if (draggingDivider.current === 0) {
          const newLeft = Math.max(15, Math.min(50, startWidths[0] + deltaPercent));
          const diff = newLeft - startWidths[0];
          const newMiddle = Math.max(20, startWidths[1] - diff);
          next[0] = newLeft;
          next[1] = newMiddle;
          next[2] = 100 - newLeft - newMiddle;
        } else {
          const newMiddle = Math.max(20, Math.min(60, startWidths[1] + deltaPercent));
          const diff = newMiddle - startWidths[1];
          const newRight = Math.max(15, startWidths[2] - diff);
          next[1] = newMiddle;
          next[2] = newRight;
          next[0] = 100 - newMiddle - newRight;
        }
        return next;
      });
    };

    const onMouseUp = () => {
      draggingDivider.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [panelWidths]);

  return (
    <div className="fixed left-0 right-0 bottom-0 px-4 pt-3 pb-2 flex flex-col overflow-hidden bg-[#eee9f5]" style={{ top: '61px' }}>
      <div className="mb-4">
        <Link href="/problems" className="text-indigo-600 hover:text-indigo-700 text-sm mb-2 inline-block font-medium">&larr; Back to Problems</Link>
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-800">{problem.title}</h1>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
            problem.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
            problem.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
            'bg-rose-50 text-rose-600 border-rose-200'
          }`}>
            {problem.difficulty}
          </span>
          {problem.concepts && problem.concepts.length > 0 && (
            <div className="flex gap-2">
              {problem.concepts.map((concept) => (
                <Link 
                  key={concept.slug} 
                  href={`/concepts/${concept.slug}`}
                  className="text-xs bg-indigo-50 px-2 py-1 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors font-medium"
                >
                  {concept.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div ref={containerRef} className="flex flex-1 min-h-0 gap-0">
        <div style={{ width: `${panelWidths[0]}%` }} className="overflow-y-auto pr-2 space-y-4 min-w-0 flex-shrink-0">
          <div className="flex gap-2 border-b border-violet-200/30">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'description'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('testcases')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'testcases'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Test Cases ({problem.testCases?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'results'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Results
              {(isRunning || isSubmitting) && (
                <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              )}
              {!isRunning && !isSubmitting && testResults && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-lg ${
                  testResults.success ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {testResults.passedTests}/{testResults.totalTests}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'description' && (
            <div className="soft-card p-6 rounded-2xl">
              <div className="prose prose-sm max-w-none mb-6
                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:my-3
                prose-strong:text-slate-800 prose-strong:font-semibold
                prose-em:text-slate-700
                prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-pre:p-4
                prose-ul:text-slate-600 prose-ul:my-2
                prose-li:text-slate-600 prose-li:my-1
                prose-headings:text-slate-800 prose-headings:font-semibold
              ">
                <ReactMarkdown
                  components={{
                    code: ({ className, children, ...props }) => {
                      const isInline = !className;
                      if (isInline) {
                        return (
                          <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-lg text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto text-sm text-slate-200">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {problem.description}
                </ReactMarkdown>
              </div>
              
              {problem.testCases && problem.testCases.length > 0 && (
                <>
                  <h3 className="text-md font-semibold text-slate-800 mb-3">Examples</h3>
                  <div className="space-y-4">
                    {problem.testCases.slice(0, 2).map((testCase, idx) => (
                      <div key={testCase.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-400 mb-2">Example {idx + 1}</div>
                        <div className="space-y-2 text-sm font-mono">
                          <div>
                            <span className="text-slate-400 select-none">Input: </span>
                            <span className="text-slate-700">{formatTestInput(testCase.input)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 select-none">Output: </span>
                            <span className="text-slate-700">{JSON.stringify(testCase.expectedOutput)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {problem.constraints && problem.constraints.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-semibold text-slate-800 mb-3">Constraints</h3>
                  <ul className="list-disc list-inside text-slate-500 text-sm space-y-1">
                    {problem.constraints.map((constraint, idx) => (
                      <li key={idx} className="font-mono">{constraint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'testcases' && (
            <div className="space-y-4">
              {problem.testCases?.map((testCase, idx) => (
                <div key={testCase.id} className="soft-card p-4 rounded-2xl">
                  <div className="text-sm font-medium text-slate-800 mb-3">Test Case {idx + 1}</div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Input</div>
                      <pre className="bg-slate-900 p-3 rounded-xl text-sm font-mono text-slate-300 overflow-x-auto">
                        {formatTestInput(testCase.input)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Expected Output</div>
                      <pre className="bg-slate-900 p-3 rounded-xl text-sm font-mono text-emerald-400 overflow-x-auto">
                        {JSON.stringify(testCase.expectedOutput, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-4">
              {(isRunning || isSubmitting) && (
                <div className="soft-card p-8 rounded-2xl flex flex-col items-center justify-center gap-4">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-6 bg-indigo-500 rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 0.12}s`, animationDuration: '0.8s' }}
                      />
                    ))}
                  </div>
                  <p className="text-slate-500 text-sm">
                    {isSubmitting ? 'Submitting against all test cases…' : 'Running your code…'}
                  </p>
                </div>
              )}

              {!isRunning && !isSubmitting && error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
                  <h3 className="text-sm font-medium text-rose-600 mb-2">Error</h3>
                  <pre className="text-sm font-mono text-rose-600 whitespace-pre-wrap">{error}</pre>
                </div>
              )}

              {!isRunning && !isSubmitting && output && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                  <h3 className="text-sm font-medium text-emerald-600 mb-2">Success</h3>
                  <p className="text-emerald-700">{output}</p>
                </div>
              )}

              {!isRunning && !isSubmitting && testResults && (
                <>
                  <div className={`p-4 rounded-2xl border ${
                    testResults.success 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-rose-50 border-rose-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-semibold ${
                        testResults.success ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {testResults.success ? 'Accepted' : 'Wrong Answer'}
                      </span>
                      <span className="text-sm text-slate-500">
                        {testResults.passedTests} / {testResults.totalTests} test cases passed
                      </span>
                    </div>
                  </div>

                  {testResults.results.map((result, idx) => (
                    <div 
                      key={result.testCaseId} 
                      className={`soft-card p-4 rounded-2xl ${
                        result.passed ? 'border-emerald-300/30' : 'border-rose-300/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-2 h-2 rounded-full ${
                          result.passed ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        <span className="text-sm font-medium text-slate-800">
                          Test Case {idx + 1}
                        </span>
                        <span className={`text-xs font-medium ${
                          result.passed ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {result.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>

                      {result.error ? (
                        <div className="bg-slate-900 p-3 rounded-xl">
                          <div className="text-xs text-slate-500 mb-1">Error</div>
                          <pre className="text-sm font-mono text-rose-400 whitespace-pre-wrap">{result.error}</pre>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Input</div>
                            <pre className="bg-slate-900 p-2 rounded-xl text-xs font-mono text-slate-300">
                              {formatTestInput(result.input)}
                            </pre>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Expected</div>
                              <pre className="bg-slate-900 p-2 rounded-xl text-xs font-mono text-emerald-400">
                                {JSON.stringify(result.expected)}
                              </pre>
                            </div>
                            <div>
                              <div className="text-xs text-slate-400 mb-1">Your Output</div>
                              <pre className={`bg-slate-900 p-2 rounded-xl text-xs font-mono ${
                                result.passed ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {JSON.stringify(result.actual)}
                              </pre>
                            </div>
                          </div>

                          {/* Visualize button */}
                          {vizLoading !== result.testCaseId && !vizResults[result.testCaseId] && (
                            <div className="space-y-1.5">
                              <button
                                onClick={() => visualize(result.testCaseId, result.input, result.expected)}
                                className="flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-3 py-1.5 rounded-xl transition-colors font-medium"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Visualize
                              </button>
                              {vizErrors[result.testCaseId] && (
                                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                                  {vizErrors[result.testCaseId]}
                                </p>
                              )}
                            </div>
                          )}

                          {vizLoading === result.testCaseId && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                              <div className="flex gap-1">
                                {[0,1,2].map((i) => (
                                  <div key={i} className="w-1 h-3 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                                ))}
                              </div>
                              Tracing execution…
                            </div>
                          )}

                          {vizResults[result.testCaseId] && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-cyan-600 font-medium flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  Trace
                                </span>
                                <button
                                  onClick={() => setVizResults((prev) => { const next = { ...prev }; delete next[result.testCaseId]; return next; })}
                                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  Dismiss
                                </button>
                              </div>
                              <VisualizationView
                                data={vizResults[result.testCaseId]}
                                passed={result.passed}
                                expectedOutput={result.expected}
                                actualOutput={result.actual}
                                testInput={result.input}
                                userCode={code}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {!isRunning && !isSubmitting && !error && !output && !testResults && (
                <div className="soft-card p-8 rounded-2xl text-center">
                  <p className="text-slate-400">Run your code to see results here.</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Divider 1 */}
        <div
          onMouseDown={startResize(0)}
          className="flex-shrink-0 w-1.5 mx-1 rounded-full bg-violet-200/30 hover:bg-violet-400 transition-colors cursor-col-resize self-stretch"
        />

        <div style={{ width: `${panelWidths[1]}%` }} className="flex flex-col h-full min-h-[500px] min-w-0 flex-shrink-0">
          <div className="bg-slate-900 border border-violet-200/20 rounded-2xl overflow-hidden flex flex-col h-full shadow-lg shadow-violet-300/10">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => handleLanguageChange('python')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    language === 'python'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Python
                </button>
                {problem.starterCodeJs && (
                  <button
                    onClick={() => handleLanguageChange('javascript')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      language === 'javascript'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    JavaScript
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={analyzeCode}
                  disabled={isRunning || isSubmitting || isAnalyzing}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  {isAnalyzing ? 'Analysing…' : 'Analyse'}
                </button>
                <button 
                  onClick={runCode}
                  disabled={isRunning || isSubmitting || isAnalyzing}
                  className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-600/50 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  {isRunning ? 'Running...' : 'Run'}
                </button>
                <button 
                  onClick={submitCode}
                  disabled={isRunning || isSubmitting || isAnalyzing}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  onClick={createPlaycard}
                  disabled={!testResults?.success || isGeneratingPlaycard || isRunning || isSubmitting}
                  title={testResults?.success ? 'Generate a flashcard for this problem' : 'Solve the problem first to unlock'}
                  className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  {isGeneratingPlaycard ? (
                    <>
                      <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="6" width="20" height="14" rx="2" />
                        <path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
                      </svg>
                      Playcard
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex-grow relative">
              <CodeEditor 
                initialCode={code} 
                onChange={(val) => setCode(val || '')} 
                language={language} 
              />
            </div>
          </div>
        </div>

        {/* Divider 2 */}
        <div
          onMouseDown={startResize(1)}
          className="flex-shrink-0 w-1.5 mx-1 rounded-full bg-violet-200/30 hover:bg-violet-400 transition-colors cursor-col-resize self-stretch"
        />

        {/* Analysis panel — always visible on the right */}
        <div style={{ width: `${panelWidths[2]}%` }} className="overflow-y-auto pl-1 space-y-4 min-w-0 flex-shrink-0">
          <div className="flex items-center justify-between border-b border-violet-200/30 pb-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm font-medium text-slate-800">Analysis</span>
            </div>
            {analysisResult && !isAnalyzing && (
              <button
                onClick={analyzeCode}
                disabled={isAnalyzing}
                className="text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 px-3 py-1 rounded-lg font-medium transition-colors"
              >
                Re-analyse
              </button>
            )}
          </div>

          {isAnalyzing && (
            <div className="soft-card p-10 rounded-2xl flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-6 bg-purple-500 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.12}s`, animationDuration: '0.8s' }}
                  />
                ))}
              </div>
              <p className="text-slate-500 text-base">Analysing your solution with Claude…</p>
            </div>
          )}

          {!isAnalyzing && !analysisResult && (
            <div className="space-y-3">
              <div className="soft-card p-6 rounded-2xl text-center space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-800 font-medium mb-1 text-base">Analyse My Solution</p>
                  <p className="text-slate-500 text-sm">Get AI feedback on time &amp; space complexity, optimality, and code quality.</p>
                </div>
                <button
                  onClick={analyzeCode}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-purple-500/25"
                >
                  Analyse
                </button>
              </div>
              <button
                onClick={getHint}
                disabled={isHinting}
                className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 border border-amber-200 text-amber-600 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isHinting ? 'Thinking…' : 'What am I doing wrong?'}
              </button>
            </div>
          )}

          {!isAnalyzing && analysisResult && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                analysisResult.analysis.isOptimal
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  analysisResult.analysis.isOptimal ? 'bg-emerald-100' : 'bg-amber-100'
                }`}>
                  {analysisResult.analysis.isOptimal ? (
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`text-base font-semibold mb-0.5 ${
                    analysisResult.analysis.isOptimal ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {analysisResult.analysis.isOptimal ? 'Optimal Solution' : 'Not Optimal'}
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed">{analysisResult.analysis.optimalityExplanation}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="soft-card p-3 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Time</span>
                  </div>
                  <p className="text-2xl font-bold font-mono text-slate-800">{analysisResult.analysis.timeComplexity}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{analysisResult.analysis.timeComplexityReason}</p>
                </div>
                <div className="soft-card p-3 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Space</span>
                  </div>
                  <p className="text-2xl font-bold font-mono text-slate-800">{analysisResult.analysis.spaceComplexity}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{analysisResult.analysis.spaceComplexityReason}</p>
                </div>
              </div>

              <div className="soft-card p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span className="text-base font-medium text-slate-800">Feedback</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{analysisResult.analysis.feedback}</p>
              </div>
            </div>
          )}

          {/* Hint section — always shown below analysis results */}
          {!isAnalyzing && analysisResult && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              {!isHinting && !hintResult && (
                <button
                  onClick={getHint}
                  className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What am I doing wrong?
                </button>
              )}

              {isHinting && (
                <div className="soft-card p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-5 bg-amber-500 rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 0.12}s`, animationDuration: '0.8s' }}
                      />
                    ))}
                  </div>
                  <p className="text-slate-500 text-sm">Reviewing your code…</p>
                </div>
              )}

              {!isHinting && hintResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-slate-800">Hints</span>
                    </div>
                    <button
                      onClick={getHint}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg font-medium transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                    <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Area to focus on</span>
                    <p className="text-amber-800 text-sm font-medium mt-0.5">{hintResult.area}</p>
                  </div>
                  <div className="space-y-2">
                    {hintResult.hints.map((hint, i) => (
                      <div key={i} className="flex gap-3 soft-card p-3 rounded-xl">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 border border-amber-200 text-amber-600 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-slate-600 text-sm leading-relaxed">{hint}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Playcard saved toast */}
      {playcardToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-violet-200 text-slate-800 px-4 py-3 rounded-2xl shadow-xl animate-fade-in-up">
          <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-800">Playcard saved!</span>
            <span className="text-xs text-slate-400">Added to your Problems collection</span>
          </div>
          <Link
            href="/playcards?tab=problems"
            className="ml-2 text-xs text-violet-600 hover:text-violet-700 font-medium whitespace-nowrap transition-colors"
            onClick={() => setPlaycardToast(false)}
          >
            View →
          </Link>
          <button
            className="ml-1 text-slate-400 hover:text-slate-600 transition-colors"
            onClick={() => setPlaycardToast(false)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
