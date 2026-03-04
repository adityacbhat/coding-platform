'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { sanitizeMermaid } from '@/lib/mermaid-sanitize';
import type { ExecutionFrame } from '@/app/api/visualize/route';

type Props = {
  code: string;
  path: ExecutionFrame[];
  userCode?: string;
  testInput?: unknown;
  expectedOutput?: unknown;
};

const FRAME_FILL: Record<ExecutionFrame['highlight'], string> = {
  normal:  '#0c4a6e',  // sky-900
  success: '#14532d',  // green-900
};
const FRAME_STROKE: Record<ExecutionFrame['highlight'], string> = {
  normal:  '#38bdf8',  // sky-400
  success: '#4ade80',  // green-400
};
const VISITED_FILL   = '#1e293b';
const VISITED_STROKE = '#334155';

/** Find the outer <g class="node"> element by Mermaid node ID. */
function findNodeEl(container: Element, nodeId: string): Element | null {
  return (
    container.querySelector(`[id^="flowchart-${nodeId}-"]`) ??
    container.querySelector(`[id="${nodeId}"]`) ??
    null
  );
}

/** Find the visible shape child (rect, polygon, circle, ellipse) of a node <g>. */
function findShape(nodeEl: Element): HTMLElement | null {
  return (nodeEl.querySelector('rect, polygon, circle, ellipse') ?? null) as HTMLElement | null;
}

export default function AnimatedDiagram({ code, path, userCode, testInput, expectedOutput }: Props) {
  const uid = useId().replace(/:/g, '');
  const mainRef  = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [svg, setSvg] = useState('');
  const [renderError, setRenderError] = useState('');
  const [frame, setFrame] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Saved original fill/stroke per SVG node element ID
  const origStyles = useRef<Record<string, { fill: string; stroke: string }>>({});

  // ── Render Mermaid ───────────────────────────────────────────────────────────
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
      // Validate syntax before rendering to avoid Mermaid's built-in error overlay
      const valid = await mermaid.parse(clean, { suppressErrors: true });
      if (!valid) {
        console.error('Mermaid parse failed. Sanitized code:', clean);
        throw new Error('Mermaid syntax error — try re-visualizing.');
      }
      const { svg: rendered } = await mermaid.render(`amd-${uid}`, clean);
      if (!cancelled) setSvg(rendered);
    };
    render().catch((e: Error) => { 
      console.error('Mermaid render error:', e, '\nOriginal code:', code);
      if (!cancelled) setRenderError(e.message); 
    });
    return () => { cancelled = true; };
  }, [code, uid]);

  // ── Save original styles from mainRef (same HTML in both containers) ────────
  const saveOriginals = useCallback(() => {
    const c = mainRef.current;
    if (!c) return;
    c.querySelectorAll('g.node').forEach((node) => {
      const shape = findShape(node);
      if (shape && node.id) {
        origStyles.current[node.id] = {
          fill:   shape.style.fill   || shape.getAttribute('fill')   || '',
          stroke: shape.style.stroke || shape.getAttribute('stroke') || '',
        };
      }
    });
  }, []);

  const applyHighlightsToContainer = useCallback((c: HTMLDivElement, frameIdx: number) => {
    if (!path.length) return;

    // Reset every node to original
    c.querySelectorAll('g.node').forEach((node) => {
      const shape = findShape(node);
      const saved = origStyles.current[node.id];
      if (shape && saved) {
        shape.style.fill    = saved.fill;
        shape.style.stroke  = saved.stroke;
        shape.style.opacity = '1';
      }
    });

    // Dim all previously visited frames
    for (let i = 0; i < frameIdx; i++) {
      const el = findNodeEl(c, path[i].node_id);
      if (!el) continue;
      const shape = findShape(el);
      if (shape) {
        shape.style.fill    = VISITED_FILL;
        shape.style.stroke  = VISITED_STROKE;
        shape.style.opacity = '0.4';
      }
    }

    // Highlight current frame
    const cur = path[frameIdx];
    if (cur) {
      const el = findNodeEl(c, cur.node_id);
      if (el) {
        const shape = findShape(el);
        if (shape) {
          shape.style.fill    = FRAME_FILL[cur.highlight];
          shape.style.stroke  = FRAME_STROKE[cur.highlight];
          shape.style.opacity = '1';
        }
      }
    }
  }, [path]);

  const applyHighlights = useCallback((frameIdx: number) => {
    if (mainRef.current)  applyHighlightsToContainer(mainRef.current,  frameIdx);
    if (modalRef.current) applyHighlightsToContainer(modalRef.current, frameIdx);
  }, [applyHighlightsToContainer]);

  useEffect(() => {
    if (!svg) return;
    requestAnimationFrame(() => {
      saveOriginals();
      applyHighlights(0);
    });
  }, [svg, saveOriginals, applyHighlights]);

  useEffect(() => {
    if (!svg) return;
    applyHighlights(frame);
  }, [frame, svg, applyHighlights]);

  // Apply highlights + auto-scale SVG when modal opens or frame changes
  useEffect(() => {
    if (!isExpanded || !svg) return;
    requestAnimationFrame(() => {
      if (!modalRef.current) return;

      // Scale SVG to fill its container without scrolling
      const svgEl = modalRef.current.querySelector('svg');
      if (svgEl) {
        svgEl.removeAttribute('width');
        svgEl.removeAttribute('height');
        svgEl.style.width  = '100%';
        svgEl.style.height = '100%';
        svgEl.style.maxWidth  = '100%';
        svgEl.style.maxHeight = '100%';
        svgEl.style.display   = 'block';
      }

      applyHighlightsToContainer(modalRef.current, frame);
    });
  }, [isExpanded, svg, frame, applyHighlightsToContainer]);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Controls ─────────────────────────────────────────────────────────────────
  const prev = () => setFrame((f) => Math.max(0, f - 1));
  const next = () => setFrame((f) => Math.min(path.length - 1, f + 1));

  const cur = path[frame];

  // Build cumulative state per frame: carry forward any variable not mentioned in a frame
  // so every variable is always visible even if the AI omitted it from an intermediate frame
  const cumulativeStates = useMemo(() =>
    path.reduce<Array<Record<string, string>>>((acc, f, i) => {
      acc.push(i === 0 ? { ...f.state } : { ...acc[i - 1], ...f.state });
      return acc;
    }, []),
    [path]
  );

  // All variable keys that appear across any frame, sorted
  const allVarKeys = useMemo(() =>
    Array.from(new Set(path.flatMap(f => Object.keys(f.state)))).sort(),
    [path]
  );

  const curState  = cumulativeStates[frame]      ?? {};
  const prevState = cumulativeStates[frame - 1]  ?? {};

  // ── Render ───────────────────────────────────────────────────────────────────
  if (renderError) {
    return (
      <div className="bg-rose-900/20 border border-rose-800/40 rounded-xl p-4 text-xs text-rose-400">
        Diagram parse error — try re-visualizing.
        <details className="mt-2 opacity-60 cursor-pointer">
          <summary>Details</summary>
          {renderError}
        </details>
      </div>
    );
  }

  // Shared controls UI (used in both inline and modal)
  const Controls = (
    <div className="flex items-center justify-center gap-2">
      <button onClick={prev} disabled={frame === 0}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-25 text-slate-200 text-lg">
        ‹
      </button>
      <span className="text-xs text-slate-500 tabular-nums min-w-[60px] text-center">
        {frame + 1} / {path.length}
      </span>
      <button onClick={next} disabled={frame === path.length - 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-25 text-slate-200 text-lg">
        ›
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Diagram with expand button */}
      {!svg ? (
        <div className="flex items-center gap-2 text-slate-500 text-xs py-8 justify-center">
          <div className="w-3 h-3 border-2 border-slate-600 border-t-cyan-500 rounded-full animate-spin" />
          Rendering diagram…
        </div>
      ) : (
        <div className="relative">
          <div
            ref={mainRef}
            className="overflow-x-auto bg-slate-900/50 rounded-xl border border-slate-800 p-3"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          {/* Expand button - always visible */}
          <button
            onClick={() => setIsExpanded(true)}
            title="Expand diagram"
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
        </div>
      )}

      {/* Progress dots */}
      {path.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap px-1">
          {path.map((f, i) => (
            <button
              key={i}
              onClick={() => setFrame(i)}
              title={f.event}
              className={`rounded-full ${
                i === frame
                  ? `w-3 h-3 ${f.highlight === 'success' ? 'bg-emerald-400' : 'bg-cyan-400'}`
                  : i < frame
                  ? 'w-2 h-2 bg-slate-600'
                  : 'w-2 h-2 bg-slate-800'
              }`}
            />
          ))}
          <span className="ml-2 text-xs text-slate-500 tabular-nums">{frame + 1} / {path.length}</span>
        </div>
      )}

      {/* Current step info */}
      {cur && (
        <div className={`rounded-xl border px-3 py-2.5 space-y-1.5 ${
          cur.highlight === 'success'
            ? 'bg-emerald-900/20 border-emerald-700/40'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <p className={`text-xs font-medium ${
            cur.highlight === 'success' ? 'text-emerald-300' : 'text-slate-200'
          }`}>
            {cur.event}
          </p>

          {allVarKeys.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-0.5">
              {allVarKeys.map((k) => {
                const val        = curState[k]  ?? '—';
                const prevVal    = frame > 0 ? (prevState[k] ?? '—') : undefined;
                const changed    = prevVal !== undefined && JSON.stringify(val) !== JSON.stringify(prevVal);
                const comparing  = cur.comparing?.includes(k) ?? false;
                return (
                  <span key={k} className={`text-[11px] font-mono flex items-center gap-1 min-w-0 rounded px-1 -mx-1 ${
                    comparing ? 'bg-sky-900/40' : ''
                  }`}>
                    {comparing && (
                      <span className="text-sky-500 flex-shrink-0 text-[10px]">↔</span>
                    )}
                    <span className={`flex-shrink-0 ${comparing ? 'text-sky-400' : 'text-slate-500'}`}>{k}:</span>
                    {changed && prevVal !== undefined && (
                      <>
                        <span className="text-slate-600 line-through truncate">{prevVal}</span>
                        <span className="text-slate-600 flex-shrink-0">→</span>
                      </>
                    )}
                    <span className={`truncate ${
                      comparing   ? 'text-sky-200 font-semibold' :
                      changed     ? (cur.highlight === 'success' ? 'text-emerald-300' : 'text-cyan-300') :
                                    'text-slate-400'
                    }`}>
                      {val}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      {Controls}

      {/* Fullscreen modal */}
      {isExpanded && typeof document !== 'undefined' && createPortal(
        (() => {
          const sortedVarKeys = allVarKeys;

          return (
            <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 overflow-hidden">

              {/* ── Header ── */}
              <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-800 flex-shrink-0">
                <span className="text-sm font-semibold text-slate-200 flex-shrink-0">Execution Flow</span>

                {/* Test input */}
                {!!testInput && (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider flex-shrink-0">Input</span>
                    <span className="font-mono text-xs text-slate-300 truncate">
                      {Object.entries(testInput as Record<string, unknown>).map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join(', ')}
                    </span>
                  </div>
                )}

                {/* Expected */}
                {expectedOutput !== undefined && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Expected</span>
                    <span className="font-mono text-xs text-emerald-400">{JSON.stringify(expectedOutput)}</span>
                  </div>
                )}

                {/* Step badge */}
                {cur && (
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ml-auto ${
                    cur.highlight === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                  }`}>
                    Step {frame + 1} / {path.length}
                  </span>
                )}

                <button onClick={() => setIsExpanded(false)}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* ── Body: Code (left) | Diagram (center) | Variables (right) ── */}
              <div className="flex flex-1 min-h-0">

                {/* Left panel: Code */}
                <div className="w-80 flex-shrink-0 border-r border-slate-800 flex flex-col min-h-0 bg-slate-950">
                  {/* Current event header */}
                  {cur && (
                    <div className={`flex-shrink-0 px-4 py-3 border-b border-slate-800 ${
                      cur.highlight === 'success' ? 'bg-emerald-900/20' : 'bg-slate-900/60'
                    }`}>
                      <p className={`text-xs font-semibold mb-0.5 ${
                        cur.highlight === 'success' ? 'text-emerald-300' : 'text-slate-200'
                      }`}>
                        {cur.highlight === 'success' ? '✓ ' : ''}{cur.event}
                      </p>
                    </div>
                  )}

                  {/* Full code with current line highlighted */}
                  <div className="flex-1 overflow-y-auto px-3 py-3">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2 px-1">
                      Code {cur && cur.line > 0 && `· Line ${cur.line}`}
                    </p>
                    {userCode && (
                      <div className="space-y-0">
                        {userCode.split('\n').filter(l => l.trim() !== '').map((line, i) => {
                          const lineNum = i + 1;
                          const isActive = cur && lineNum === cur.line;
                          return (
                            <div key={lineNum} className={`flex items-start gap-2 rounded px-1.5 py-0.5 ${
                              isActive ? 'bg-sky-900/40' : ''
                            }`}>
                              <span className={`text-[11px] font-mono select-none w-5 text-right flex-shrink-0 mt-px ${
                                isActive ? 'text-cyan-400' : 'text-slate-600'
                              }`}>
                                {lineNum}
                              </span>
                              <span className={`font-mono text-xs leading-snug whitespace-pre ${
                                isActive ? 'text-cyan-200' : 'text-slate-400'
                              }`}>
                                {line}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: Diagram */}
                <div className="flex-1 min-w-0 min-h-0 flex flex-col">
                  <div className="flex-1 p-6 flex items-center justify-center overflow-hidden">
                    <div
                      ref={modalRef}
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: svg }}
                    />
                  </div>

                  {/* Progress dots and controls at bottom of diagram */}
                  <div className="flex-shrink-0 border-t border-slate-800 px-4 py-3 bg-slate-900/30">
                    <div className="flex items-center justify-center gap-1 flex-wrap mb-3">
                      {path.map((f, i) => (
                        <button key={i} onClick={() => setFrame(i)} title={f.event}
                          className={`rounded-full ${
                            i === frame
                              ? `w-3 h-3 ${f.highlight === 'success' ? 'bg-emerald-400' : 'bg-cyan-400'}`
                              : i < frame ? 'w-2 h-2 bg-slate-600' : 'w-2 h-2 bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    {Controls}
                  </div>
                </div>

                {/* Right panel: Variables - show ALL variables at every step */}
                <div className="w-72 flex-shrink-0 border-l border-slate-800 flex flex-col min-h-0">
                  <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800 bg-slate-900/60">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Variables</p>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                    {sortedVarKeys.map((key) => {
                      const val        = curState[key];
                      const prevVal    = frame > 0 ? prevState[key] : undefined;
                      const changed    = prevVal !== undefined && val !== undefined && JSON.stringify(val) !== JSON.stringify(prevVal);
                      const comparing  = cur?.comparing?.includes(key) ?? false;
                      const hasValue   = val !== undefined;

                      return (
                        <div key={key} className={`rounded-lg border px-3 py-2 ${
                          !hasValue  ? 'border-slate-800/50 bg-slate-900/20 opacity-50' :
                          comparing  ? 'border-sky-500/50 bg-sky-900/20' :
                          changed    ? 'border-cyan-800/40 bg-cyan-900/10' :
                                       'border-slate-800 bg-slate-900/40'
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-mono font-medium ${comparing ? 'text-sky-400' : 'text-slate-500'}`}>
                              {comparing && <span className="mr-1">↔</span>}
                              {key}
                            </span>
                            {comparing && (
                              <span className="text-[9px] font-medium text-sky-500">checking</span>
                            )}
                            {!comparing && changed && (
                              <span className="text-[9px] font-medium text-cyan-600">changed</span>
                            )}
                          </div>

                          {hasValue ? (
                            <div className="mt-1">
                              {changed && prevVal !== undefined && (
                                <p className="text-[11px] font-mono text-slate-600 line-through leading-snug">
                                  {prevVal}
                                </p>
                              )}
                              <p className={`text-sm font-mono font-semibold leading-snug break-all ${
                                comparing  ? 'text-sky-200' :
                                changed    ? 'text-cyan-300' :
                                             'text-slate-300'
                              }`}>
                                {val}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs font-mono text-slate-600 mt-1">—</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
}
