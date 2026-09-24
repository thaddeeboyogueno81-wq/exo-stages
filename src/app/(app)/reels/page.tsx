import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import ReelFeed from '@/components/social/ReelFeed';
import type { Post } from '@/lib/types';

export const metadata: Metadata = { title: 'Reels' };

export default async function ReelsPage() {
  const user = await requireUser('/reels');
  const supabase = createClient();

  const { data } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(*)')
    .eq('type', 'reel')
    .eq('media_kind', 'video')
    .order('created_at', { ascending: false })
    .limit(50);

  const posts = (data ?? []) as unknown as Post[];

  return <ReelFeed posts={posts} meId={user.id} />;
}
