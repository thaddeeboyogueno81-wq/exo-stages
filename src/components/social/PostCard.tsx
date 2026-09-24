'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import ReportButton from '@/components/ReportButton';
import { timeAgo } from '@/lib/utils';
import type { Comment, Post } from '@/lib/types';

/** Carte de publication (reel du fil) : like, commentaire, partage, signalement. */
export default function PostCard({ post, meId }: { post: Post; meId: string }) {
  const supabase = createClient();
  const [liked, setLiked] = useState(Boolean(post.liked_by_me));
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => Math.max(c + (next ? 1 : -1), 0));
    if (next) {
      await supabase.from('likes').insert({ post_id: post.id, user_id: meId });
    } else {
      await supabase.from('likes').delete().match({ post_id: post.id, user_id: meId });
    }
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(*)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
      .limit(50);
    setComments((data as unknown as Comment[]) ?? []);
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);
    await supabase.from('comments').insert({
      post_id: post.id,
      author_id: meId,
      content: newComment.trim().slice(0, 1000),
    });
    setNewComment('');
    await loadComments();
    setSending(false);
  };

  const share = async () => {
    const url = `${window.location.origin}/reels?post=${post.id}`;
    try {
      await navigator.share?.({ url, text: post.caption });
      if (!navigator.share) throw new Error('no-share');
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const deletePost = async () => {
    if (!confirm('Supprimer cette publication ?')) return;
    await supabase.from('posts').delete().eq('id', post.id);
    window.location.reload();
  };

  useEffect(() => {
    // Temps réel : nouveaux likes/commentaires pendant que la carte est affichée
    const channel = supabase
      .channel('post-' + post.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` },
        () => loadComments()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  return (
    <article className="card mb-4 overflow-hidden">
      <header className="flex items-center gap-3 p-4 pb-3">
        <Avatar profile={post.author} />
        <div className="min-w-0 flex-1">
          <Link href={`/profil/${post.author_id}`} className="text-sm font-semibold hover:underline">
            {post.author?.display_name || post.author?.username || 'Utilisateur'}
          </Link>
          <p className="text-xs text-slate-500">{timeAgo(post.created_at)}</p>
        </div>
        {post.author_id === meId && (
          <button onClick={deletePost} className="text-xs text-slate-400 hover:text-red-600">
            Supprimer
          </button>
        )}
        <ReportButton targetType="post" targetId={post.id} />
      </header>

      {post.caption && (
        <p className="px-4 pb-3 text-sm leading-relaxed">{post.caption}</p>
      )}

      {post.media_kind === 'video' ? (
        <video
          src={post.media_url}
          controls
          playsInline
          preload="metadata"
          className="w-full bg-black"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.media_url} alt={post.caption || 'Publication'} className="w-full" />
      )}

      <footer className="flex items-center gap-4 px-4 py-3 text-sm">
        <button
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label="J'aime"
          className={`flex items-center gap-1.5 ${liked ? 'text-pink-600' : 'text-slate-600 hover:text-pink-600'}`}
        >
          <span aria-hidden>{liked ? '❤️' : '🤍'}</span>
          {likeCount}
        </button>
        <button
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments && comments === null) loadComments();
          }}
          className="flex items-center gap-1.5 text-slate-600 hover:text-lify-700"
          aria-expanded={showComments}
        >
          💬 {post.comment_count ?? 0}
        </button>
        <button onClick={share} className="text-slate-600 hover:text-lify-700">
          {copied ? 'Lien copié ✅' : '↗ Partager'}
        </button>
      </footer>

      {showComments && (
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          {comments === null ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  <Avatar profile={c.author} size={28} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">
                      {c.author?.username || 'utilisateur'}{' '}
                      <span className="font-normal text-slate-400">
                        {timeAgo(c.created_at)}
                      </span>
                    </p>
                    <p className="text-sm">{c.content}</p>
                  </div>
                </li>
              ))}
              {comments.length === 0 && (
                <li className="text-sm text-slate-500">
                  Soyez la première personne à commenter.
                </li>
              )}
            </ul>
          )}

          <form onSubmit={addComment} className="mt-4 flex gap-2">
            <label htmlFor={'comment-' + post.id} className="sr-only">
              Ajouter un commentaire
            </label>
            <input
              id={'comment-' + post.id}
              className="input flex-1"
              placeholder="Ajouter un commentaire…"
              maxLength={1000}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" disabled={sending || !newComment.trim()} className="btn-primary">
              Publier
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
