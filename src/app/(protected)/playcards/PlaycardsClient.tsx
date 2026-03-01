'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlaycardDeckView, PlaycardEditor, type PlaycardData } from '@/components/PlaycardFlip';

type TabId = 'concepts' | 'problems';

const TABS: { id: TabId; label: string }[] = [
  { id: 'concepts', label: 'Concepts' },
  { id: 'problems', label: 'Problems' },
];

export default function PlaycardsClient() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') === 'problems' ? 'problems' : 'concepts') satisfies TabId;
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [cards, setCards] = useState<PlaycardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingCard, setEditingCard] = useState<PlaycardData | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/playcards?section=${activeTab}`);
    const data = await res.json();
    setCards(data.playcards ?? []);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    setAdding(false);
    setEditingCard(null);
    fetchCards();
  }, [fetchCards]);

  const handleSave = async (front: string, back: string) => {
    await fetch('/api/playcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: activeTab, front, back }),
    });
    setAdding(false);
    fetchCards();
  };

  const handleEditSave = async (front: string, back: string) => {
    if (!editingCard) return;
    const res = await fetch(`/api/playcards/${editingCard.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front, back }),
    });
    const data = await res.json();
    setCards((prev) => prev.map((c) => (c.id === editingCard.id ? data.playcard : c)));
    setEditingCard(null);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/playcards/${id}`, { method: 'DELETE' });
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const isFormOpen = adding || editingCard !== null;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-1">
          Playcards
        </h1>
        <p className="text-slate-500 text-sm">Flash cards for quick revision — flip, navigate, repeat.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex bg-violet-100/30 rounded-xl p-1 gap-1 border border-violet-200/30">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/60 text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!isFormOpen && (
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/25"
            onClick={() => setAdding(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Playcard
          </button>
        )}
      </div>

      <div className="border-t border-violet-200/30 mb-8" />

      {loading ? (
        <div className="flex items-center justify-center py-28">
          <div className="w-7 h-7 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : adding ? (
        <div className="flex justify-center py-6">
          <PlaycardEditor
            section={activeTab}
            onSave={handleSave}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : editingCard ? (
        <div className="flex justify-center py-6">
          <PlaycardEditor
            section={activeTab}
            initialFront={editingCard.front}
            initialBack={editingCard.back}
            saveLabel="Save Changes"
            onSave={handleEditSave}
            onCancel={() => setEditingCard(null)}
          />
        </div>
      ) : (
        <PlaycardDeckView
          cards={cards}
          onDelete={handleDelete}
          onEdit={setEditingCard}
        />
      )}
    </div>
  );
}
