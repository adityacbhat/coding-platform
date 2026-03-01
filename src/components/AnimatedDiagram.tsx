'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
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
  error:   '#78350f',  // amber-900
  success: '#14532d',  // green-900
};
const FRAME_STROKE: Record<ExecutionFrame['highlight'], string> = {
  normal:  '#38bdf8',  // sky-400
  error:   '#fbbf24',  // amber-400
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Saved original fill/stroke per SVG node element ID
  const origStyles = useRef<Record<string, { fill: string; stroke: string }>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      if (!valid) throw new Error('Mermaid syntax error — try re-visualizing.');
      const { svg: rendered } = await mermaid.render(`amd-${uid}`, clean);
      if (!cancelled) setSvg(rendered);
    };
    render().catch((e: Error) => { if (!cancelled) setRenderError(e.message); });
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

  // ── Auto-play ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPlaying || path.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setFrame((f) => {
        if (f >= path.length - 1) {
          setIsPlaying(false);
          return f;
        }
        return f + 1;
      });
    }, 1500);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, path.length]);

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
  const prev = () => { setIsPlaying(false); setFrame((f) => Math.max(0, f - 1)); };
  const next = () => { setIsPlaying(false); setFrame((f) => Math.min(path.length - 1, f + 1)); };

  const cur = path[frame];
  const prevFrame = frame > 0 ? path[frame - 1] : null;

  // Only show state entries that changed vs previous frame
  const stateDiffs = cur
    ? Object.entries(cur.state).filter(
        ([k, v]) => !prevFrame || JSON.stringify(v) !== JSON.stringify(prevFrame.state[k])
      )
    : [];

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
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-25 text-slate-200 text-lg transition-colors">
        ‹
      </button>
      <button onClick={() => setIsPlaying(!isPlaying)}
        className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors min-w-[80px] justify-center">
        {isPlaying ? <><span className="text-sm">⏸</span> Pause</> : <><span className="text-sm">▶</span> Play</>}
      </button>
      <button onClick={next} disabled={frame === path.length - 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-25 text-slate-200 text-lg transition-colors">
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
        <div className="relative group">
          <div
            ref={mainRef}
            className="overflow-x-auto bg-slate-900/50 rounded-xl border border-slate-800 p-3"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          {/* Expand button */}
          <button
            onClick={() => setIsExpanded(true)}
            title="Expand diagram"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white"
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
              onClick={() => { setIsPlaying(false); setFrame(i); }}
              title={f.event}
              className={`rounded-full transition-all duration-200 ${
                i === frame
                  ? `w-3 h-3 ${
                      f.highlight === 'error'   ? 'bg-amber-400' :
                      f.highlight === 'success' ? 'bg-emerald-400' :
                                                  'bg-cyan-400'
                    }`
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
          cur.highlight === 'error'
            ? 'bg-amber-900/20 border-amber-700/40'
            : cur.highlight === 'success'
            ? 'bg-emerald-900/20 border-emerald-700/40'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <p className={`text-xs font-medium ${
            cur.highlight === 'error'   ? 'text-amber-300' :
            cur.highlight === 'success' ? 'text-emerald-300' :
                                          'text-slate-200'
          }`}>
            {cur.event}
          </p>

          {stateDiffs.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {stateDiffs.slice(0, 3).map(([k, v]) => (
                <span key={k} className="text-[11px] font-mono flex items-center gap-1">
                  <span className="text-slate-500">{k}:</span>
                  {prevFrame && (
                    <>
                      <span className="text-slate-600 line-through">{prevFrame.state[k] ?? '—'}</span>
                      <span className="text-slate-600">→</span>
                    </>
                  )}
                  <span className={
                    cur.highlight === 'error'   ? 'text-amber-300' :
                    cur.highlight === 'success' ? 'text-emerald-300' :
                                                  'text-cyan-300'
                  }>
                    {v}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      {Controls}

      {/* Fullscreen modal */}
      {isExpanded && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-800 flex-shrink-0">
            <span className="text-sm font-semibold text-slate-200 flex-shrink-0">Execution Flow</span>

            {/* Test input */}
            {testInput && (
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
                cur.highlight === 'error'   ? 'bg-amber-500/20 text-amber-300' :
                cur.highlight === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                                              'bg-slate-700 text-slate-400'
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

          {/* ── Body: diagram + variables side panel ── */}
          <div className="flex flex-1 min-h-0">

            {/* Diagram — fills available height, SVG scaled via useEffect */}
            <div className="flex-1 min-w-0 min-h-0 p-6 flex items-center justify-center overflow-hidden">
              <div
                ref={modalRef}
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>

            {/* Variables panel */}
            <div className="w-72 flex-shrink-0 border-l border-slate-800 flex flex-col min-h-0">
              {/* Current event */}
              {cur && (
                <div className={`flex-shrink-0 px-4 py-3 border-b border-slate-800 ${
                  cur.highlight === 'error'   ? 'bg-amber-900/20' :
                  cur.highlight === 'success' ? 'bg-emerald-900/20' :
                                                'bg-slate-900/60'
                }`}>
                  <p className={`text-xs font-semibold mb-0.5 ${
                    cur.highlight === 'error'   ? 'text-amber-300' :
                    cur.highlight === 'success' ? 'text-emerald-300' :
                                                  'text-slate-200'
                  }`}>
                    {cur.highlight === 'error' ? '⚑ ' : cur.highlight === 'success' ? '✓ ' : ''}
                    {cur.event}
                  </p>
                  {cur.highlight === 'error' && (
                    <p className="text-[11px] text-amber-400/70 mt-0.5">This is where it goes wrong</p>
                  )}
                </div>
              )}

              {/* Code snippet for current line */}
              {userCode && cur && cur.line > 0 && (() => {
                const lines = userCode.split('\n');
                const curLine = cur.line - 1; // 0-indexed
                const start = Math.max(0, curLine - 2);
                const end   = Math.min(lines.length - 1, curLine + 2);
                const snippet = lines.slice(start, end + 1);
                return (
                  <div className="flex-shrink-0 border-b border-slate-800 bg-slate-950 px-4 py-3">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2">Code · Line {cur.line}</p>
                    <div className="space-y-0.5">
                      {snippet.map((line, i) => {
                        const lineNum = start + i + 1;
                        const isActive = lineNum === cur.line;
                        const isError  = isActive && cur.highlight === 'error';
                        return (
                          <div key={lineNum} className={`flex items-start gap-2 rounded px-1 py-0.5 ${
                            isError  ? 'bg-amber-900/40' :
                            isActive ? 'bg-sky-900/40'   : ''
                          }`}>
                            <span className={`text-[10px] font-mono select-none w-5 text-right flex-shrink-0 mt-0.5 ${
                              isActive ? (isError ? 'text-amber-400' : 'text-cyan-400') : 'text-slate-600'
                            }`}>
                              {lineNum}
                            </span>
                            <span className={`font-mono text-xs break-all whitespace-pre-wrap ${
                              isError  ? 'text-amber-200' :
                              isActive ? 'text-cyan-200'  : 'text-slate-500'
                            }`}>
                              {line || ' '}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Variable list — scrollable */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Variables</p>

                {cur && Object.entries(cur.state).map(([key, val]) => {
                  const prev = prevFrame?.state[key];
                  const changed = prev !== undefined && JSON.stringify(val) !== JSON.stringify(prev);
                  const isError = cur.highlight === 'error';

                  return (
                    <div key={key} className={`rounded-lg border px-3 py-2.5 space-y-1 ${
                      changed && isError   ? 'border-amber-700/40 bg-amber-900/10' :
                      changed             ? 'border-cyan-800/40 bg-cyan-900/10' :
                                            'border-slate-800 bg-slate-900/40'
                    }`}>
                      <span className="text-[10px] font-mono font-medium text-slate-500 uppercase tracking-wider">
                        {key}
                      </span>

                      {/* Previous value (strikethrough) if it changed */}
                      {changed && prev !== undefined && (
                        <p className="text-xs font-mono text-slate-600 line-through leading-snug">
                          {prev}
                        </p>
                      )}

                      {/* Current value */}
                      <p className={`text-sm font-mono font-semibold leading-snug break-all ${
                        changed && isError   ? 'text-amber-300' :
                        changed             ? 'text-cyan-300' :
                                              'text-slate-300'
                      }`}>
                        {val}
                      </p>

                      {changed && (
                        <span className={`text-[10px] font-medium ${isError ? 'text-amber-500' : 'text-cyan-600'}`}>
                          ↑ changed
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Show unchanged vars from previous frame if current frame has none */}
                {!cur && prevFrame && Object.entries(prevFrame.state).map(([key, val]) => (
                  <div key={key} className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{key}</span>
                    <p className="text-sm font-mono font-semibold text-slate-300 mt-1">{val}</p>
                  </div>
                ))}
              </div>

              {/* Progress dots */}
              <div className="flex-shrink-0 border-t border-slate-800 px-4 py-3">
                <div className="flex items-center gap-1 flex-wrap mb-3">
                  {path.map((f, i) => (
                    <button key={i} onClick={() => { setIsPlaying(false); setFrame(i); }} title={f.event}
                      className={`rounded-full transition-all duration-200 ${
                        i === frame
                          ? `w-3 h-3 ${f.highlight === 'error' ? 'bg-amber-400' : f.highlight === 'success' ? 'bg-emerald-400' : 'bg-cyan-400'}`
                          : i < frame ? 'w-2 h-2 bg-slate-600' : 'w-2 h-2 bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                {Controls}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
