import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import Avatar from '@/components/Avatar';
import FollowButton from '@/components/social/FollowButton';
import MessageButton from '@/components/social/MessageButton';
import ReportButton from '@/components/ReportButton';
import { INTERESTS } from '@/lib/constants';
import { timeAgo } from '@/lib/utils';
import type { Post } from '@/lib/types';

export const metadata: Metadata = { title: 'Profil' };

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const user = await requireUser(`/profil/${params.id}`);
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();
  if (!profile) notFound();

  const [{ data: posts }, { count: followers }, { count: following }, { data: follow }] =
    await Promise.all([
      supabase
        .from('posts')
        .select('*')
        .eq('author_id', params.id)
        .eq('type', 'reel')
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('following_id', params.id),
      supabase
        .from('follows')
        .select('following_id', { count: 'exact', head: true })
        .eq('follower_id', params.id),
      supabase
        .from('follows')
        .select('follower_id')
        .match({ follower_id: user.id, following_id: params.id })
        .maybeSingle(),
    ]);

  const isMe = user.id === params.id;

  return (
    <>
      <div className="card mb-6 p-6">
        <div className="flex items-start gap-4">
          <Avatar profile={profile} size={72} linked={false} />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-sm text-slate-500">@{profile.username}</p>
            <p className="mt-1 text-xs text-slate-400">
              Membre depuis {timeAgo(profile.created_at)}
            </p>
            {profile.bio && (
              <p className="mt-2 text-sm leading-relaxed">{profile.bio}</p>
            )}
            {profile.interests.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.interests
                  .filter((i) => (INTERESTS as readonly string[]).includes(i))
                  .map((i) => (
                    <span
                      key={i}
                      className="rounded-full bg-lify-50 px-2.5 py-0.5 text-xs text-lify-700"
                    >
                      {i}
                    </span>
                  ))}
              </div>
            )}
            <div className="mt-3 flex gap-4 text-sm text-slate-600">
              <span><strong>{followers ?? 0}</strong> abonné·e·s</span>
              <span><strong>{following ?? 0}</strong> abonnements</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isMe ? (
              <Link href="/parametres" className="btn-ghost">
                Modifier le profil
              </Link>
            ) : (
              <>
                <FollowButton targetId={params.id} initialFollowing={Boolean(follow)} />
                <MessageButton targetId={params.id} />
                <ReportButton targetType="profile" targetId={params.id} />
              </>
            )}
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-600">Publications</h2>
      {(posts ?? []).length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          Aucune publication pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {(posts ?? []).map((p: Post) => (
            <Link
              key={p.id}
              href="/fil"
              className="aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800"
            >
              {p.media_kind === 'video' ? (
                <video src={p.media_url} className="h-full w-full object-cover" muted preload="metadata" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.media_url} alt={p.caption || 'Publication'} className="h-full w-full object-cover" loading="lazy" />
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
