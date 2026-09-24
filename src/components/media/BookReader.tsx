'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { consumeQuota } from '@/lib/quota';
import type { MediaContent } from '@/lib/types';

/** Lecteur de livres : taille de texte, mode sombre, reprise de lecture (V1). */
export default function BookReader({
  book,
  meId,
  initialPosition,
}: {
  book: MediaContent;
  meId: string;
  initialPosition: number;
}) {
  const [chapters, setChapters] = useState<string[] | null>(null);
  const [position, setPosition] = useState(initialPosition);
  const [fontSize, setFontSize] = useState(18);
  const [dark, setDark] = useState(false);
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(initialPosition > 0); // reprise = déjà autorisé

  // Charger le texte du livre (découpage en paragraphes/chapitres)
  useEffect(() => {
    if (!allowed) return;
    fetch(book.book_url ?? '')
      .then((r) => {
        if (!r.ok) throw new Error('Texte indisponible');
        return r.text();
      })
      .then((text) => {
        const paragraphs = text
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean);
        // découpage en "chapitres" de ~40 paragraphes pour la pagination
        const size = 40;
        const chunks: string[] = [];
        for (let i = 0; i < paragraphs.length; i += size) {
          chunks.push(paragraphs.slice(i, i + size).join('\n\n'));
        }
        setChapters(chunks);
      })
      .catch(() => setLoadError('Impossible de charger le texte de ce livre pour le moment.'));
  }, [book.book_url, allowed]);

  // Sauvegarder la progression (reprise de lecture)
  useEffect(() => {
    if (!allowed || chapters === null) return;
    const supabase = createClient();
    supabase.from('reading_progress').upsert({
      user_id: meId,
      media_id: book.id,
      position,
      updated_at: new Date().toISOString(),
    });
  }, [position, chapters, meId, book.id, allowed]);

  const openBook = async () => {
    const ok = await consumeQuota('book');
    if (!ok) {
      setQuotaBlocked(true);
      return;
    }
    setAllowed(true);
  };

  const currentText = useMemo(
    () => (chapters ? chapters[Math.min(position, chapters.length - 1)] : ''),
    [chapters, position]
  );

  if (!allowed) {
    return (
      <div className="card p-8 text-center">
        <p className="text-4xl">📖</p>
        <h1 className="mt-3 text-xl font-bold">{book.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {book.creator_credit} · {book.license}
        </p>
        <p className="mt-4 text-sm text-slate-600">{book.description}</p>
        {quotaBlocked ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Vous avez ouvert 3 nouveaux livres ce mois-ci (mode gratuit).
            Revenez le mois prochain ! 💙
          </p>
        ) : (
          <button onClick={openBook} className="btn-primary mt-6">
            Ouvrir ce livre
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <header className="mb-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{book.title}</h1>
          <p className="truncate text-xs text-slate-500">{book.creator_credit}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setFontSize((s) => Math.min(s + 2, 28))}
            aria-label="Agrandir le texte"
            className="btn-ghost h-9 w-9 p-0"
          >
            A+
          </button>
          <button
            onClick={() => setFontSize((s) => Math.max(s - 2, 14))}
            aria-label="Réduire le texte"
            className="btn-ghost h-9 w-9 p-0"
          >
            A-
          </button>
          <button
            onClick={() => setDark((d) => !d)}
            aria-pressed={dark}
            aria-label="Mode sombre"
            className="btn-ghost h-9 w-9 p-0"
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <article
        className={`card whitespace-pre-line p-6 leading-relaxed ${
          dark ? 'bg-slate-900 text-slate-100' : ''
        }`}
        style={{ fontSize }}
        aria-label="Texte du livre"
      >
        {loadError ?? (chapters ? currentText : 'Chargement du texte…')}
      </article>

      {chapters && !loadError && (
        <nav className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => setPosition((p) => Math.max(p - 1, 0))}
            disabled={position === 0}
            className="btn-ghost"
          >
            ← Précédent
          </button>
          <span className="text-xs text-slate-500">
            Section {position + 1} / {chapters.length}
          </span>
          <button
            onClick={() => setPosition((p) => Math.min(p + 1, chapters.length - 1))}
            disabled={position >= chapters.length - 1}
            className="btn-primary"
          >
            Suivant →
          </button>
        </nav>
      )}
    </div>
  );
}
