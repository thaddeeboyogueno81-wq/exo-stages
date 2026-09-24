'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { timeAgo } from '@/lib/utils';
import type { Post } from '@/lib/types';

/** Visionneuse de stories : progression 5 s par story, expiration 24 h côté base. */
export default function StoryViewer({
  stories,
  startIndex,
  onClose,
}: {
  stories: Post[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = stories[index];

  useEffect(() => {
    setProgress(0);
    timer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer.current!);
          if (index < stories.length - 1) setIndex((i) => i + 1);
          else onClose();
          return 0;
        }
        return p + 2; // 100 pas * 100 ms = 5 s
      });
    }, 100);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [index, stories.length, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < stories.length - 1) setIndex(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) setIndex(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, stories.length, onClose]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative aspect-[9/16] w-full max-w-md overflow-hidden rounded-2xl bg-slate-900">
        {/* Barres de progression */}
        <div className="absolute inset-x-2 top-2 z-20 flex gap-1">
          {stories.map((s, i) => (
            <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded bg-white/30">
              <div
                className="h-full bg-white"
                style={{ width: i < index ? '100%' : i === index ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Zones de navigation */}
        <button
          aria-label="Story précédente"
          className="absolute inset-y-0 left-0 z-10 w-1/3"
          onClick={() => (index > 0 ? setIndex(index - 1) : onClose())}
        />
        <button
          aria-label="Story suivante"
          className="absolute inset-y-0 right-0 z-10 w-1/3"
          onClick={() =>
            index < stories.length - 1 ? setIndex(index + 1) : onClose()
          }
        />

        {current.media_kind === 'video' ? (
          <video
            src={current.media_url}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.media_url}
            alt={current.caption || 'Story'}
            className="h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-sm font-semibold text-white">
            @{current.author?.username}
          </p>
          <p className="text-xs text-slate-300">{timeAgo(current.created_at)}</p>
          {current.caption && (
            <p className="mt-1 text-sm text-white">{current.caption}</p>
          )}
        </div>

        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-6 z-30 rounded-full bg-white/20 px-2 py-0.5 text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/** Crée une story (upload Storage + ligne posts). */
export async function createStory(
  userId: string,
  file: File,
  caption: string,
  durationHours: number
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'bin';
  const path = `posts/${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(path, file);
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
  const mediaKind = file.type.startsWith('video') ? 'video' : 'image';

  const { error } = await supabase.from('posts').insert({
    author_id: userId,
    type: 'story',
    caption,
    media_url: urlData.publicUrl,
    media_kind: mediaKind,
    expires_at: new Date(Date.now() + durationHours * 3600 * 1000).toISOString(),
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
