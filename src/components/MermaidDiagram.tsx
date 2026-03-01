'use client';

import { useEffect, useId, useState } from 'react';
import { sanitizeMermaid } from '@/lib/mermaid-sanitize';

type Props = {
  code: string;
};

export default function MermaidDiagram({ code }: Props) {
  const uid = useId().replace(/:/g, '');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        suppressErrorRendering: true,
        themeVariables: {
          background: '#0f172a',
          primaryColor: '#1e293b',
          primaryBorderColor: '#334155',
          primaryTextColor: '#e2e8f0',
          secondaryColor: '#1e293b',
          tertiaryColor: '#0f172a',
          lineColor: '#475569',
          textColor: '#cbd5e1',
          edgeLabelBackground: '#1e293b',
          nodeTextColor: '#e2e8f0',
          clusterBkg: '#0f172a',
          clusterBorder: '#334155',
          titleColor: '#94a3b8',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: '13px',
        },
      });

      const clean = sanitizeMermaid(code);
      const valid = await mermaid.parse(clean, { suppressErrors: true });
      if (!valid) throw new Error('Mermaid syntax error — try re-visualizing.');
      const { svg: rendered } = await mermaid.render(`mmd-${uid}`, clean);
      if (!cancelled) setSvg(rendered);
    };

    render().catch((e: Error) => {
      if (!cancelled) setError(e.message);
    });

    return () => { cancelled = true; };
  }, [code, uid]);

  if (error) {
    return (
      <div className="bg-rose-900/20 border border-rose-800/40 rounded-xl p-4 text-xs text-rose-400 font-mono whitespace-pre-wrap">
        Diagram parse error — try re-visualizing.
        <details className="mt-2 opacity-60 cursor-pointer">
          <summary>Details</summary>
          {error}
        </details>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-xs py-6 justify-center">
        <div className="w-3 h-3 border-2 border-slate-600 border-t-cyan-500 rounded-full animate-spin" />
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      className="mermaid-wrap overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
