'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export type PlaycardData = {
  id: number;
  front: string;
  back: string;
  section: string;
  createdAt: string;
};

function parseFront(text: string) {
  const lines = text.split('\n').map((l) => l.trim());
  let title = '';
  let description = '';
  const ioLines: string[] = [];
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith('Problem:')) {
      title = line.replace('Problem:', '').trim();
    } else if (line.startsWith('Input:') || line.startsWith('Output:')) {
      ioLines.push(line);
    } else if (!description) {
      description = line;
    }
  }
  return { title, description, ioLines, raw: !title && !ioLines.length };
}

function parseBack(text: string) {
  const lines = text.split('\n').map((l) => l.trim());
  let type = '';
  const ioLines: string[] = [];
  const steps: string[] = [];
  let link = '';
  let inAlgo = false;
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith('Type:')) {
      type = line.replace('Type:', '').trim();
    } else if (line.startsWith('Input:') || line.startsWith('Output:')) {
      ioLines.push(line);
    } else if (line.toLowerCase().startsWith('algorithm')) {
      inAlgo = true;
    } else if (line.startsWith('Link:')) {
      link = line.replace('Link:', '').trim();
      inAlgo = false;
    } else if (inAlgo) {
      steps.push(line);
    }
  }
  return { type, ioLines, steps, link, raw: !type && !steps.length && !link };
}

type PlaycardEditorProps = {
  section: string;
  initialFront?: string;
  initialBack?: string;
  saveLabel?: string;
  onSave: (front: string, back: string) => void;
  onCancel: () => void;
};

export function PlaycardEditor({
  section: _section,
  initialFront = '',
  initialBack = '',
  saveLabel = 'Save Card',
  onSave,
  onCancel,
}: PlaycardEditorProps) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>{flipped ? 'Side B — back' : 'Side A — front'}</span>
        <span>·</span>
        <span>Click card to flip</span>
      </div>

      <div
        className="relative cursor-pointer"
        style={{ width: 560, height: 360, perspective: 1200 }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          <div
            className="absolute inset-0 rounded-2xl border border-blue-500/30 flex flex-col p-8 shadow-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden', background: 'linear-gradient(145deg, rgba(59,130,246,0.09) 0%, #0f172a 35%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-8 right-8 h-px bg-blue-500/30" />
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs font-semibold text-blue-400/60 uppercase tracking-widest">Side A · Front</span>
              <button className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
                onClick={(e) => { e.stopPropagation(); setFlipped(true); }}>
                Flip to back →
              </button>
            </div>
            <textarea
              className="flex-1 resize-none bg-transparent text-slate-100 placeholder-slate-600 leading-snug outline-none text-center font-bold"
              style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: '1.35rem' }}
              placeholder="Write the question, term, or concept here…"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div
            className="absolute inset-0 rounded-2xl border border-emerald-500/30 flex flex-col p-8 shadow-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(145deg, rgba(16,185,129,0.09) 0%, #0f172a 35%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-8 right-8 h-px bg-emerald-500/30" />
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs font-semibold text-emerald-400/60 uppercase tracking-widest">Side B · Back</span>
              <button className="text-xs text-slate-500 hover:text-emerald-400 transition-colors"
                onClick={(e) => { e.stopPropagation(); setFlipped(false); }}>
                ← Flip to front
              </button>
            </div>
            <textarea
              className="flex-1 resize-none bg-transparent text-slate-100 placeholder-slate-600 text-sm leading-relaxed outline-none"
              placeholder="Write the answer, algorithm, or explanation here…"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => { if (front.trim() && back.trim()) onSave(front.trim(), back.trim()); }}
          disabled={!front.trim() || !back.trim()}
        >
          {saveLabel}
        </button>
        <button
          className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function DeckFrontContent({ text }: { text: string }) {
  const { title, description, ioLines, raw } = parseFront(text);

  if (raw) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-100 text-2xl leading-snug whitespace-pre-wrap text-center font-bold"
           style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
          {text}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center gap-3 min-h-0">
      {title && (
        <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest text-center">
          Problem: {title}
        </p>
      )}
      {description && (
        <p className="text-slate-100 text-xl leading-snug text-center font-bold"
           style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
          {description}
        </p>
      )}
      {ioLines.length > 0 && (
        <div className="bg-slate-800/60 rounded-xl px-4 py-3 space-y-1 border border-slate-700/40">
          {ioLines.map((line, i) => {
            const [label, ...rest] = line.split(':');
            return (
              <p key={i} className="text-sm font-mono">
                <span className="text-slate-500">{label}: </span>
                <span className="text-slate-200">{rest.join(':').trim()}</span>
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeckBackContent({ text }: { text: string }) {
  const { type, ioLines, steps, link, raw } = parseBack(text);

  if (raw) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-100 text-base leading-relaxed whitespace-pre-wrap text-center">
          {text}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-2.5 min-h-0 overflow-hidden">
      {type && (
        <div className="flex justify-center shrink-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
            {type}
          </span>
        </div>
      )}

      {ioLines.length > 0 && (
        <div className="shrink-0 bg-slate-800/60 rounded-lg px-3 py-2 border border-slate-700/40 space-y-0.5">
          {ioLines.map((line, i) => {
            const [label, ...rest] = line.split(':');
            return (
              <p key={i} className="text-xs font-mono">
                <span className="text-slate-500">{label}: </span>
                <span className="text-slate-200">{rest.join(':').trim()}</span>
              </p>
            );
          })}
        </div>
      )}

      {steps.length > 0 && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mb-1.5">Algorithm</p>
          <div className="space-y-1">
            {steps.map((step, i) => (
              <p key={i} className="text-slate-200 text-xs leading-snug">{step}</p>
            ))}
          </div>
        </div>
      )}

      {link && (
        <div className="shrink-0 pt-2 border-t border-slate-700/50">
          <Link
            href={link}
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium group"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span className="group-hover:underline">{link}</span>
          </Link>
        </div>
      )}
    </div>
  );
}

type PlaycardDeckViewProps = {
  cards: PlaycardData[];
  onDelete: (id: number) => void;
  onEdit: (card: PlaycardData) => void;
};

export function PlaycardDeckView({ cards, onDelete, onEdit }: PlaycardDeckViewProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const safeIndex = Math.min(index, Math.max(0, cards.length - 1));

  const prevLengthRef = useRef(cards.length);
  useEffect(() => {
    if (cards.length < prevLengthRef.current) {
      setIndex((i) => Math.min(i, Math.max(0, cards.length - 1)));
      setFlipped(false);
      setConfirmDelete(false);
    }
    prevLengthRef.current = cards.length;
  }, [cards.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowLeft') { setFlipped(false); setIndex((i) => Math.max(0, i - 1)); }
      else if (e.key === 'ArrowRight') { setFlipped(false); setIndex((i) => Math.min(cards.length - 1, i + 1)); }
      else if (e.key === 'Enter') { setFlipped((f) => !f); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cards.length]);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-slate-400 text-sm">No cards here yet.</p>
        <p className="text-slate-300 text-xs">Click &quot;+ Add Playcard&quot; above to create one.</p>
      </div>
    );
  }

  const card = cards[safeIndex];
  const goTo = (dir: -1 | 1) => { setFlipped(false); setIndex((i) => Math.min(Math.max(0, i + dir), cards.length - 1)); };

  return (
    <div className="flex flex-col items-center gap-8 py-4 select-none">
      <div className="group relative" style={{ width: 560, height: 360 }}>
        <div className="absolute inset-0 rounded-2xl bg-slate-800 border border-slate-700/40"
             style={{ transform: 'translate(10px, 10px) rotate(2.5deg)' }} />
        <div className="absolute inset-0 rounded-2xl bg-slate-800 border border-slate-700/50"
             style={{ transform: 'translate(5px, 5px) rotate(1.2deg)' }} />

        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {confirmDelete ? (
            <>
              <button
                className="w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                title="Confirm delete"
                onClick={(e) => { e.stopPropagation(); onDelete(card.id); setConfirmDelete(false); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition-colors"
                title="Cancel"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                className="w-8 h-8 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-colors border border-slate-700/60"
                title="Edit card"
                onClick={(e) => { e.stopPropagation(); onEdit(card); }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                className="w-8 h-8 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors border border-slate-700/60"
                title="Delete card"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </>
          )}
        </div>

        <div className="absolute inset-0 cursor-pointer" style={{ perspective: 1200 }}
             onClick={() => setFlipped((f) => !f)}>
          <div className="w-full h-full transition-transform duration-500 relative"
               style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
            <div className="absolute inset-0 rounded-2xl border border-slate-700/60 flex flex-col p-7 shadow-2xl overflow-hidden"
                 style={{ backfaceVisibility: 'hidden', background: 'linear-gradient(145deg, rgba(59,130,246,0.09) 0%, #0f172a 35%)' }}>
              <div className="absolute top-0 left-8 right-8 h-px bg-blue-500/30" />
              <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-blue-500/40" />
              <DeckFrontContent text={card.front} />
            </div>
            <div className="absolute inset-0 rounded-2xl border border-slate-700/60 flex flex-col p-6 shadow-2xl overflow-hidden"
                 style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(145deg, rgba(16,185,129,0.09) 0%, #0f172a 35%)' }}>
              <div className="absolute top-0 left-8 right-8 h-px bg-emerald-500/30" />
              <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
              <DeckBackContent text={card.back} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button
          className="w-11 h-11 rounded-full flex items-center justify-center soft-card hover:border-violet-300/40 text-slate-400 hover:text-violet-500 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          onClick={() => goTo(-1)} disabled={safeIndex === 0} title="Previous (←)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="tabular-nums text-slate-500 text-sm font-medium w-16 text-center">
          {safeIndex + 1} / {cards.length}
        </span>
        <button
          className="w-11 h-11 rounded-full flex items-center justify-center soft-card hover:border-violet-300/40 text-slate-400 hover:text-violet-500 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          onClick={() => goTo(1)} disabled={safeIndex === cards.length - 1} title="Next (→)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-slate-400">
        <kbd className="px-1.5 py-0.5 rounded bg-violet-100/30 border border-violet-200/30 font-mono text-slate-500">←</kbd>
        {' '}<kbd className="px-1.5 py-0.5 rounded bg-slate-700 border border-slate-600 font-mono text-slate-400">→</kbd>
        {' '}to navigate ·{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-violet-100/30 border border-violet-200/30 font-mono text-slate-500">Enter</kbd>
        {' '}to flip
      </p>
    </div>
  );
}
