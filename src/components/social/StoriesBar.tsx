'use client';

import { useState } from 'react';
import StoryViewer from '@/components/social/StoryViewer';
import Avatar from '@/components/Avatar';
import Link from 'next/link';
import type { Post, Profile } from '@/lib/types';

/** Carrousel des stories actives (24 h) en haut du fil. */
export default function StoriesBar({ stories }: { stories: Post[] }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Regrouper par auteur, garder la plus récente comme couverture
  const byAuthor = new Map<string, { profile?: Profile; story: Post }>();
  for (const s of stories) {
    const existing = byAuthor.get(s.author_id);
    if (!existing || new Date(s.created_at) > new Date(existing.story.created_at)) {
      byAuthor.set(s.author_id, { profile: s.author, story: s });
    }
  }
  const grouped = Array.from(byAuthor.values());
  const orderedStories = grouped.map((g) => g.story);

  return (
    <>
      <section aria-label="Stories" className="mb-6">
        <div className="flex gap-4 overflow-x-auto pb-1">
          <Link
            href="/publier?type=story"
            className="flex w-16 shrink-0 flex-col items-center gap-1"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-2xl text-slate-400 dark:border-slate-700">
              +
            </span>
            <span className="w-full truncate text-center text-[10px] text-slate-500">
              Ma story
            </span>
          </Link>

          {orderedStories.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setViewerIndex(i)}
              className="flex w-16 shrink-0 flex-col items-center gap-1"
              aria-label={`Story de ${s.author?.display_name || s.author_id}`}
            >
              <span className="rounded-full bg-gradient-to-tr from-lify-600 to-pink-500 p-0.5">
                <span className="block rounded-full bg-white p-0.5 dark:bg-slate-950">
                  <Avatar profile={s.author} size={56} linked={false} />
                </span>
              </span>
              <span className="w-full truncate text-center text-[10px] text-slate-500">
                {s.author?.username || 'inconnu'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {viewerIndex !== null && (
        <StoryViewer
          stories={orderedStories}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
