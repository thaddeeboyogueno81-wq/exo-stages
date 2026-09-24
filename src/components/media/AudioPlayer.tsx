'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { consumeQuota } from '@/lib/quota';
import { formatDuration } from '@/lib/utils';
import ReportButton from '@/components/ReportButton';
import type { MediaContent } from '@/lib/types';

/** Lecteur audio du catalogue, avec quota du mode gratuit et favori. */
export default function AudioPlayer({ item, meId }: { item: MediaContent; meId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [favorite, setFavorite] = useState(Boolean(item.is_favorite));
  const [quotaBlocked, setQuotaBlocked] = useState(false);

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

  const play = async () => {
    // Chaque lecture consomme le quota gratuit (sauf reprise immédiate)
    if (audioRef.current && audioRef.current.paused && audioRef.current.currentTime === 0) {
      const allowed = await consumeQuota('media');
      if (!allowed) {
        setQuotaBlocked(true);
        return;
      }
    }
    audioRef.current?.play();
    setPlaying(true);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setPlaying(false);
    audio.addEventListener('ended', onEnd);
    return () => audio.removeEventListener('ended', onEnd);
  }, []);

  return (
    <div className="card flex items-center gap-4 p-4">
      <button
        onClick={() => (playing ? (audioRef.current?.pause(), setPlaying(false)) : play())}
        aria-label={playing ? 'Pause' : 'Lecture'}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lify-600 text-xl text-white hover:bg-lify-700"
      >
        {playing ? '⏸' : '▶'}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.title}</p>
        <p className="truncate text-xs text-slate-500">
          {item.creator_credit} · {formatDuration(item.duration_seconds)} · {item.license}
        </p>
        <audio ref={audioRef} src={item.media_url} preload="none" className="hidden" />
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
  );
}
