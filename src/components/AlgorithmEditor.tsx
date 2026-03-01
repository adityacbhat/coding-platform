'use client';

import { useRef, useEffect } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';

const ALGORITHM_SUGGESTIONS = [
  { label: 'hash map', insertText: 'hash map', detail: 'O(1) lookups', kind: 14 },
  { label: 'hash set', insertText: 'hash set', detail: 'O(1) membership', kind: 14 },
  { label: 'two pointers', insertText: 'two pointers', detail: 'Often O(n)', kind: 14 },
  { label: 'sliding window', insertText: 'sliding window', detail: 'Subarray/substring problems', kind: 14 },
  { label: 'binary search', insertText: 'binary search', detail: 'O(log n)', kind: 14 },
  { label: 'DFS', insertText: 'DFS', detail: 'Depth-first search', kind: 14 },
  { label: 'BFS', insertText: 'BFS', detail: 'Breadth-first search', kind: 14 },
  { label: 'recursion', insertText: 'recursion', detail: 'Break into subproblems', kind: 14 },
  { label: 'dynamic programming', insertText: 'dynamic programming', detail: 'Memoization/DP', kind: 14 },
  { label: 'greedy', insertText: 'greedy', detail: 'Local optimal choices', kind: 14 },
  { label: 'stack', insertText: 'stack', detail: 'LIFO', kind: 14 },
  { label: 'queue', insertText: 'queue', detail: 'FIFO', kind: 14 },
  { label: 'heap', insertText: 'heap', detail: 'Priority queue, min/max', kind: 14 },
  { label: 'sort', insertText: 'sort', detail: 'Often O(n log n)', kind: 14 },
  { label: 'merge sort', insertText: 'merge sort', detail: 'O(n log n) stable', kind: 14 },
  { label: 'quick sort', insertText: 'quick sort', detail: 'O(n log n) average', kind: 14 },
  { label: 'trie', insertText: 'trie', detail: 'Prefix tree', kind: 14 },
  { label: 'union find', insertText: 'union find', detail: 'Disjoint sets', kind: 14 },
  { label: 'backtracking', insertText: 'backtracking', detail: 'Explore and prune', kind: 14 },
  { label: 'prefix sum', insertText: 'prefix sum', detail: 'Range queries O(1)', kind: 14 },
  { label: 'Kadane\'s algorithm', insertText: 'Kadane\'s algorithm', detail: 'Max subarray', kind: 14 },
  { label: 'Dijkstra', insertText: 'Dijkstra', detail: 'Shortest path', kind: 14 },
  { label: 'topological sort', insertText: 'topological sort', detail: 'DAG ordering', kind: 14 },
  { label: 'binary tree', insertText: 'binary tree', detail: 'Tree traversal', kind: 14 },
  { label: 'linked list', insertText: 'linked list', detail: 'Pointer manipulation', kind: 14 },
  { label: 'O(1)', insertText: 'O(1)', detail: 'Constant time', kind: 14 },
  { label: 'O(n)', insertText: 'O(n)', detail: 'Linear time', kind: 14 },
  { label: 'O(n log n)', insertText: 'O(n log n)', detail: 'Linearithmic', kind: 14 },
  { label: 'O(n²)', insertText: 'O(n²)', detail: 'Quadratic', kind: 14 },
  { label: 'space O(1)', insertText: 'space O(1)', detail: 'Constant extra space', kind: 14 },
];

interface AlgorithmEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number | string;
}

export default function AlgorithmEditor({ value, onChange, height = '100%' }: AlgorithmEditorProps) {
  const disposeRef = useRef<{ dispose: () => void } | null>(null);

  useEffect(() => () => {
    disposeRef.current?.dispose?.();
  }, []);

  const handleMount: OnMount = (_editor, monaco) => {
    disposeRef.current?.dispose?.();
    disposeRef.current = monaco.languages.registerCompletionItemProvider('plaintext', {
      triggerCharacters: [' ', '\n', '.', ','],
      provideCompletionItems: (
        model: Monaco.editor.ITextModel,
        position: Monaco.Position
      ) => {
        const word = model.getWordUntilPosition(position);
        const range: Monaco.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        const filter = word.word.toLowerCase();
        const suggestions = ALGORITHM_SUGGESTIONS.filter(
          (s) =>
            !filter ||
            s.label.toLowerCase().includes(filter) ||
            s.insertText.toLowerCase().includes(filter)
        ).map((s) => ({
          label: s.label,
          insertText: s.insertText,
          detail: s.detail,
          kind: s.kind as Monaco.languages.CompletionItemKind,
          range,
        }));
        return { suggestions };
      },
    });
  };

  return (
    <div className="h-full min-h-0 overflow-hidden rounded-lg border border-slate-800 bg-[#1e1e1e]">
      <Editor
        height={height}
        language="plaintext"
        value={value}
        theme="vs-dark"
        onChange={(val) => onChange(val ?? '')}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          lineNumbers: 'off',
          folding: false,
          wordWrap: 'on',
          suggestOnTriggerCharacters: true,
          quickSuggestions: { other: true, comments: false, strings: true },
        }}
      />
    </div>
  );
}
