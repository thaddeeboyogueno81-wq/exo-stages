'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import ReportButton from '@/components/ReportButton';
import { createClient } from '@/lib/supabase/client';
import type { Post } from '@/lib/types';

/** Défilement vertical de reels type TikTok, snap par snap. */
export default function ReelFeed({ posts, meId }: { posts: Post[]; meId: string }) {
  const supabase = createClient();
  const likedRef = useRef(new Set<string>());

  const like = async (post: Post, alreadyLiked: boolean) => {
    const key = post.id;
    if (likedRef.current.has(key) || alreadyLiked) return;
    likedRef.current.add(key);
    if (alreadyLiked) return;
    await supabase.from('likes').insert({ post_id: post.id, user_id: meId });
    const btn = document.getElementById('like-count-' + key);
    if (btn) btn.textContent = String(Number(btn.textContent || '0') + 1);
  };

  if (posts.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-4xl">🎬</p>
        <h2 className="mt-3 font-semibold">Pas encore de reels</h2>
        <p className="mt-1 text-sm text-slate-600">
          Les vidéos courtes publiées par la communauté apparaissent ici.
        </p>
        <Link href="/publier?type=reel" className="btn-primary mt-5">
          Publier un reel
        </Link>
      </div>
    );
  }

  return (
    <div className="snap-y snap-mandatory overflow-y-auto md:-mx-4 md:h-[calc(100dvh-8rem)]">
      {posts.map((post) => (
        <section
          key={post.id}
          className="relative aspect-[9/16] w-full snap-start overflow-hidden rounded-none bg-black md:mx-auto md:max-w-md md:rounded-2xl"
        >
          <video
            src={post.media_url}
            className="h-full w-full object-cover"
            controls
            loop
            playsInline
            preload="metadata"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pb-6">
            <div className="pointer-events-auto flex items-center gap-2">
              <Avatar profile={post.author} size={32} />
              <Link
                href={`/profil/${post.author_id}`}
                className="text-sm font-semibold text-white hover:underline"
              >
                @{post.author?.username || 'inconnu'}
              </Link>
            </div>
            {post.caption && (
              <p className="pointer-events-auto mt-1 line-clamp-2 text-sm text-slate-100">
                {post.caption}
              </p>
            )}
            <div className="pointer-events-auto mt-2 flex items-center gap-4 text-xs text-slate-300">
              <button
                onClick={() => like(post, Boolean(post.liked_by_me))}
                aria-label="J'aime"
                className="flex items-center gap-1"
              >
                ❤️ <span id={'like-count-' + post.id}>{post.like_count ?? 0}</span>
              </button>
              <Link href={`/fil?post=${post.id}`}>💬 {post.comment_count ?? 0}</Link>
              <ReportButton targetType="post" targetId={post.id} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
