import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import StoriesBar from '@/components/social/StoriesBar';
import PostCard from '@/components/social/PostCard';
import Link from 'next/link';
import type { Post } from '@/lib/types';

export const metadata: Metadata = { title: 'Fil' };

export default async function FeedPage() {
  const user = await requireUser('/fil');
  const supabase = createClient();

  // Stories actives (moins de 24 h), des gens qu'on suit + les nôtres
  const [{ data: stories }, { data: follows }] = await Promise.all([
    supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(*)')
      .eq('type', 'story')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('follows').select('following_id').eq('follower_id', user.id),
  ]);

  const followedIds = new Set((follows ?? []).map((f) => f.following_id));
  followedIds.add(user.id);

  // Fil : reels des personnes suivues puis le reste, chronologique (V1)
  const [{ data: posts }, { count: likeCounts }] = await Promise.all([
    supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(*)')
      .eq('type', 'reel')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('posts').select('id', { count: 'exact', head: true }),
  ]);

  // Compteurs likes / commentaires / likes de l'utilisateur
  const postIds = (posts ?? []).map((p) => p.id);
  const [likesData, commentsData, myLikes] = await Promise.all([
    supabase.from('likes').select('post_id').in('post_id', postIds),
    supabase.from('comments').select('post_id').in('post_id', postIds),
    supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds),
  ]);

  const likeMap = new Map<string, number>();
  for (const l of likesData.data ?? []) {
    likeMap.set(l.post_id, (likeMap.get(l.post_id) ?? 0) + 1);
  }
  const commentMap = new Map<string, number>();
  for (const c of commentsData.data ?? []) {
    commentMap.set(c.post_id, (commentMap.get(c.post_id) ?? 0) + 1);
  }
  const myLikeSet = new Set((myLikes.data ?? []).map((l) => l.post_id));

  const sorted = (posts ?? [])
    .map((p) => ({
      ...p,
      like_count: likeMap.get(p.id) ?? 0,
      comment_count: commentMap.get(p.id) ?? 0,
      liked_by_me: myLikeSet.has(p.id),
    }))
    .sort(
      (a: Post, b: Post) =>
        Number(followedIds.has(b.author_id)) - Number(followedIds.has(a.author_id))
    );

  return (
    <>
      <h1 className="mb-4 text-xl font-bold md:hidden">Fil</h1>
      <StoriesBar stories={(stories ?? []) as unknown as Post[]} />

      {sorted.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-4xl">👋</p>
          <h2 className="mt-3 font-semibold">Le fil est vide pour l&apos;instant</h2>
          <p className="mt-1 text-sm text-slate-600">
            Publiez la première story ou le premier reel de Lify !
          </p>
          <Link href="/publier" className="btn-primary mt-5">
            Publier quelque chose
          </Link>
        </div>
      ) : (
        sorted.map((p) => <PostCard key={p.id} post={p as Post} meId={user.id} />)
      )}
    </>
  );
}
