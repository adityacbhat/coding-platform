'use client';

import { useState } from 'react';
import Link from 'next/link';

type TestCaseRow = {
  id: number;
  input: unknown;
  expectedOutput: unknown;
  isHidden: boolean;
  orderIndex: number;
};

type ConceptOption = { id: number; slug: string; title: string };
type CompanyOption = { id: number; slug: string; name: string };

type AdminProblemEditorProps = {
  problem: {
    id: number;
    title: string;
    slug: string;
    difficulty: string;
    description: string;
    starterCodePython: string;
    starterCodeJs: string | null;
    constraints: unknown;
    hints: unknown;
    frequency: number | null;
    acceptance: number | null;
    testCases: TestCaseRow[];
    concepts: { concept: ConceptOption }[];
    companies: { company: CompanyOption }[];
  };
  allConcepts: ConceptOption[];
  allCompanies: CompanyOption[];
};

function jsonToString(val: unknown) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  return JSON.stringify(val, null, 2);
}

function StatusBadge({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null;
  const styles = {
    saving: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    saved: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    error: 'text-red-400 bg-red-400/10 border-red-400/20',
  };
  const labels = { saving: 'Saving…', saved: 'Saved', error: 'Error' };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-slate-200">{title}</h2>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
  );
}

function StringListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="px-3 py-2 rounded-xl text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-colors text-sm"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ''])}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-violet-400 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-violet-500/50 transition-colors w-full"
      >
        <span>+</span> Add item
      </button>
    </div>
  );
}

function TestCaseEditor({
  testCase,
  problemId,
  onSaved,
  onDeleted,
}: {
  testCase: TestCaseRow;
  problemId: number;
  onSaved: (updated: TestCaseRow) => void;
  onDeleted: (id: number) => void;
}) {
  const [inputStr, setInputStr] = useState(jsonToString(testCase.input));
  const [outputStr, setOutputStr] = useState(jsonToString(testCase.expectedOutput));
  const [isHidden, setIsHidden] = useState(testCase.isHidden);
  const [orderIndex, setOrderIndex] = useState(testCase.orderIndex);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const save = async () => {
    setStatus('saving');
    const res = await fetch(`/api/admin/test-cases/${testCase.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: JSON.parse(inputStr),
        expectedOutput: JSON.parse(outputStr),
        isHidden,
        orderIndex,
      }),
    });
    if (res.ok) {
      setStatus('saved');
      onSaved({ id: testCase.id, input: JSON.parse(inputStr), expectedOutput: JSON.parse(outputStr), isHidden, orderIndex });
      setTimeout(() => setStatus('idle'), 2000);
    } else {
      setStatus('error');
    }
  };

  const del = async () => {
    if (!confirm('Delete this test case?')) return;
    await fetch(`/api/admin/test-cases/${testCase.id}`, { method: 'DELETE' });
    onDeleted(testCase.id);
  };

  return (
    <div className="soft-card rounded-2xl border border-slate-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500">#{testCase.id}</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isHidden}
              onChange={(e) => setIsHidden(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
            />
            <span className="text-xs text-slate-400">Hidden</span>
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Order:</span>
            <input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <button onClick={save} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
            Save
          </button>
          <button onClick={del} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Input (JSON)</label>
          <textarea
            value={inputStr}
            onChange={(e) => setInputStr(e.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono resize-y focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Expected Output (JSON)</label>
          <textarea
            value={outputStr}
            onChange={(e) => setOutputStr(e.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono resize-y focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>
    </div>
  );
}

function GenerateTestCasesPanel({
  problemId,
  onCreated,
}: {
  problemId: number;
  onCreated: (tcs: TestCaseRow[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastGenerated, setLastGenerated] = useState(0);

  const generate = async () => {
    setStatus('generating');
    setErrorMsg('');
    const res = await fetch('/api/admin/generate-test-cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId, count }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus('error');
      setErrorMsg(data.error ?? 'Something went wrong');
      return;
    }
    const tcs: TestCaseRow[] = data.testCases.map(
      (tc: { id: number; input: unknown; expected_output: unknown; expectedOutput: unknown; is_hidden: boolean; isHidden: boolean; order_index: number; orderIndex: number }) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expected_output ?? tc.expectedOutput,
        isHidden: tc.is_hidden ?? tc.isHidden ?? false,
        orderIndex: tc.order_index ?? tc.orderIndex ?? 0,
      })
    );
    setLastGenerated(tcs.length);
    onCreated(tcs);
    setStatus('done');
    setTimeout(() => {
      setStatus('idle');
      setOpen(false);
    }, 2500);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm text-slate-400 hover:text-violet-400 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-violet-500/50 transition-colors w-full justify-center"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3 3 0 11-4.243 4.243l-.347-.347a5 5 0 010-7.072z" />
        </svg>
        Generate Test Cases with AI
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3 3 0 11-4.243 4.243l-.347-.347a5 5 0 010-7.072z" />
          </svg>
          <span className="text-sm font-medium text-violet-300">Generate Test Cases with AI</span>
        </div>
        {status === 'idle' && (
          <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
        )}
      </div>

      {status === 'done' ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {lastGenerated} test cases generated and added successfully!
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Number of test cases to generate</label>
              <div className="flex items-center gap-2">
                {[3, 5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    disabled={status === 'generating'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                      count === n
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-violet-500/30'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  disabled={status === 'generating'}
                  className="w-16 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-violet-500 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 leading-relaxed">
            The AI will analyze the problem description and constraints to generate {count} test cases,
            including edge cases like empty inputs, boundary values, and max constraints. About half will be marked as hidden.
          </div>

          {status === 'error' && (
            <p className="text-xs text-red-400">{errorMsg}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={generate}
              disabled={status === 'generating'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'generating' ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating {count} test cases…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate
                </>
              )}
            </button>
            {status === 'idle' && (
              <span className="text-xs text-slate-600">This may take 10–30 seconds</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NewTestCaseForm({ problemId, onCreated }: { problemId: number; onCreated: (tc: TestCaseRow) => void }) {
  const [open, setOpen] = useState(false);
  const [inputStr, setInputStr] = useState('{}');
  const [outputStr, setOutputStr] = useState('null');
  const [isHidden, setIsHidden] = useState(false);
  const [orderIndex, setOrderIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  const create = async () => {
    setStatus('saving');
    const res = await fetch('/api/admin/test-cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId,
        input: JSON.parse(inputStr),
        expectedOutput: JSON.parse(outputStr),
        isHidden,
        orderIndex,
      }),
    });
    if (res.ok) {
      const tc = await res.json();
      onCreated({ id: tc.id, input: JSON.parse(inputStr), expectedOutput: JSON.parse(outputStr), isHidden, orderIndex });
      setInputStr('{}');
      setOutputStr('null');
      setIsHidden(false);
      setOrderIndex(0);
      setStatus('idle');
      setOpen(false);
    } else {
      setStatus('error');
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm text-slate-400 hover:text-emerald-400 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-emerald-500/50 transition-colors w-full justify-center"
      >
        <span className="text-lg leading-none">+</span> Add Test Case
      </button>
    );
  }

  return (
    <div className="soft-card rounded-2xl border border-emerald-500/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-emerald-400">New Test Case</span>
        <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isHidden}
            onChange={(e) => setIsHidden(e.target.checked)}
            className="rounded border-slate-600 bg-slate-800 text-violet-500"
          />
          <span className="text-xs text-slate-400">Hidden</span>
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Order:</span>
          <input
            type="number"
            value={orderIndex}
            onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
            className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Input (JSON)</label>
          <textarea
            value={inputStr}
            onChange={(e) => setInputStr(e.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono resize-y focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Expected Output (JSON)</label>
          <textarea
            value={outputStr}
            onChange={(e) => setOutputStr(e.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono resize-y focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        {status === 'error' && <span className="text-xs text-red-400">Invalid JSON or server error</span>}
        <button
          onClick={create}
          disabled={status === 'saving'}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Creating…' : 'Create'}
        </button>
      </div>
    </div>
  );
}

export default function AdminProblemEditor({ problem, allConcepts, allCompanies }: AdminProblemEditorProps) {
  const [form, setForm] = useState({
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    description: problem.description,
    starterCodePython: problem.starterCodePython,
    starterCodeJs: problem.starterCodeJs ?? '',
    constraints: (problem.constraints as string[] | null) ?? [],
    hints: (problem.hints as string[] | null) ?? [],
    frequency: problem.frequency ?? 0,
    acceptance: problem.acceptance ?? 0,
    conceptIds: problem.concepts.map((pc) => pc.concept.id),
    companyIds: problem.companies.map((pc) => pc.company.id),
  });

  const [testCases, setTestCases] = useState<TestCaseRow[]>(problem.testCases);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const toggleConcept = (id: number) => {
    setForm((f) => ({
      ...f,
      conceptIds: f.conceptIds.includes(id)
        ? f.conceptIds.filter((c) => c !== id)
        : [...f.conceptIds, id],
    }));
  };

  const toggleCompany = (id: number) => {
    setForm((f) => ({
      ...f,
      companyIds: f.companyIds.includes(id)
        ? f.companyIds.filter((c) => c !== id)
        : [...f.companyIds, id],
    }));
  };

  const saveProblem = async () => {
    setSaveStatus('saving');
    const res = await fetch(`/api/admin/problems/${problem.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } else {
      setSaveStatus('error');
    }
  };

  const inputClass =
    'w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-violet-500 placeholder:text-slate-600';

  const section = 'soft-card rounded-2xl border border-slate-700 p-5 space-y-4';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/problems"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Problems
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="text-lg font-semibold text-slate-200">{problem.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={saveStatus} />
          <button
            onClick={saveProblem}
            disabled={saveStatus === 'saving'}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save Problem'}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className={section}>
        <SectionHeader title="Basic Info" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
              className={inputClass}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Frequency %</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: parseFloat(e.target.value) || 0 }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Acceptance %</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.acceptance}
                onChange={(e) => setForm((f) => ({ ...f, acceptance: parseFloat(e.target.value) || 0 }))}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className={section}>
        <SectionHeader title="Description" description="Markdown is supported." />
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={12}
          spellCheck={false}
          className={`${inputClass} font-mono text-xs resize-y`}
        />
      </div>

      {/* Constraints & Hints */}
      <div className="grid grid-cols-2 gap-6">
        <div className={section}>
          <SectionHeader title="Constraints" />
          <StringListEditor
            items={form.constraints}
            onChange={(items) => setForm((f) => ({ ...f, constraints: items }))}
            placeholder="e.g. 1 ≤ n ≤ 10^5"
          />
        </div>
        <div className={section}>
          <SectionHeader title="Hints" />
          <StringListEditor
            items={form.hints}
            onChange={(items) => setForm((f) => ({ ...f, hints: items }))}
            placeholder="e.g. Try using a hash map…"
          />
        </div>
      </div>

      {/* Starter Code */}
      <div className={section}>
        <SectionHeader title="Starter Code" description="Default code shown to users in the editor." />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Python</label>
            <textarea
              value={form.starterCodePython}
              onChange={(e) => setForm((f) => ({ ...f, starterCodePython: e.target.value }))}
              rows={8}
              spellCheck={false}
              className={`${inputClass} font-mono text-xs resize-y`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">JavaScript</label>
            <textarea
              value={form.starterCodeJs}
              onChange={(e) => setForm((f) => ({ ...f, starterCodeJs: e.target.value }))}
              rows={8}
              spellCheck={false}
              className={`${inputClass} font-mono text-xs resize-y`}
            />
          </div>
        </div>
      </div>

      {/* Concepts (Tags) */}
      <div className={section}>
        <SectionHeader title="Concepts / Tags" description={`${form.conceptIds.length} selected`} />
        <div className="flex flex-wrap gap-2">
          {allConcepts.map((concept) => {
            const selected = form.conceptIds.includes(concept.id);
            return (
              <button
                key={concept.id}
                onClick={() => toggleConcept(concept.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  selected
                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-violet-500/30 hover:text-violet-400'
                }`}
              >
                {concept.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Companies */}
      <div className={section}>
        <SectionHeader title="Companies" description={`${form.companyIds.length} selected`} />
        <div className="flex flex-wrap gap-2">
          {allCompanies.map((company) => {
            const selected = form.companyIds.includes(company.id);
            return (
              <button
                key={company.id}
                onClick={() => toggleCompany(company.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  selected
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-blue-500/30 hover:text-blue-400'
                }`}
              >
                {company.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Test Cases */}
      <div className={section}>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Test Cases" description={`${testCases.length} total · ${testCases.filter((t) => t.isHidden).length} hidden`} />
        </div>
        <div className="space-y-3">
          {testCases.map((tc) => (
            <TestCaseEditor
              key={tc.id}
              testCase={tc}
              problemId={problem.id}
              onSaved={(updated) =>
                setTestCases((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
              }
              onDeleted={(id) => setTestCases((prev) => prev.filter((t) => t.id !== id))}
            />
          ))}
          <GenerateTestCasesPanel
            problemId={problem.id}
            onCreated={(tcs) => setTestCases((prev) => [...prev, ...tcs])}
          />
          <NewTestCaseForm
            problemId={problem.id}
            onCreated={(tc) => setTestCases((prev) => [...prev, tc])}
          />
        </div>
      </div>
    </div>
  );
}
