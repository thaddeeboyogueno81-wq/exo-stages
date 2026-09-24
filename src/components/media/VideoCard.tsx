'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { consumeQuota } from '@/lib/quota';
import ReportButton from '@/components/ReportButton';
import type { MediaContent } from '@/lib/types';

/** Carte vidéo : première lecture consomme le quota du mode gratuit. */
export default function VideoCard({ item, meId }: { item: MediaContent; meId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('favorites')
      .select('media_id')
      .match({ user_id: meId, media_id: item.id })
      .maybeSingle()
      .then(({ data }) => setFavorite(Boolean(data)));
  }, [meId, item.id]);

  const onPlay = async () => {
    if (started) return;
    const allowed = await consumeQuota('media');
    if (!allowed) {
      videoRef.current?.pause();
      setQuotaBlocked(true);
      return;
    }
    setStarted(true);
  };

  const toggleFavorite = async () => {
    const supabase = createClient();
    const next = !favorite;
    setFavorite(next);
    if (next) {
      await supabase.from('favorites').insert({ user_id: meId, media_id: item.id });
    } else {
      await supabase
        .from('favorites')
        .delete()
        .match({ user_id: meId, media_id: item.id });
    }
  };

  return (
    <article className="card overflow-hidden">
      <video
        ref={videoRef}
        src={item.media_url}
        controls
        playsInline
        preload="metadata"
        onPlay={onPlay}
        className="aspect-video w-full bg-black"
      />
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{item.title}</h2>
          <p className="truncate text-xs text-slate-500">
            {item.creator_credit} · {item.license}
          </p>
          {quotaBlocked && (
            <p className="mt-1 text-xs text-red-600">
              Quota du jour atteint (mode gratuit). Revenez demain ! 💙
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            onClick={toggleFavorite}
            aria-pressed={favorite}
            aria-label="Ajouter aux favoris"
            className="text-lg"
          >
            {favorite ? '⭐' : '☆'}
          </button>
          <ReportButton targetType="media" targetId={item.id} />
        </div>
      </div>
    </article>
  );
}
