import Image from 'next/image';
import Link from 'next/link';
import type { Profile } from '@/lib/types';

export default function Avatar({
  profile,
  size = 40,
  linked = true,
}: {
  profile?: Profile | null;
  size?: number;
  linked?: boolean;
}) {
  const content = profile?.avatar_url ? (
    <Image
      src={profile.avatar_url}
      alt={profile?.display_name || 'Avatar'}
      width={size}
      height={size}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="flex items-center justify-center rounded-full bg-lify-100 font-semibold text-lify-700"
      style={{ width: size, height: size, fontSize: size / 2.5 }}
      aria-hidden
    >
      {(profile?.display_name || profile?.username || '?')
        .slice(0, 1)
        .toUpperCase()}
    </span>
  );

  if (!linked || !profile) return <span className="shrink-0">{content}</span>;
  return (
    <Link
      href={`/profil/${profile.id}`}
      className="shrink-0 rounded-full"
      aria-label={`Profil de ${profile.display_name || profile.username}`}
    >
      {content}
    </Link>
  );
}
