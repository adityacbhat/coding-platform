'use client';

import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  initialCode?: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
}

export default function CodeEditor({ initialCode = '', onChange, language = 'python' }: CodeEditorProps) {
  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-slate-800 bg-[#1e1e1e]">
      <Editor
        height="100%"
        language={language}
        value={initialCode}
        theme="vs-dark"
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
}
