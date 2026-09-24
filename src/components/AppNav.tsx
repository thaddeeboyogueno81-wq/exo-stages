'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import QuotaBadge from '@/components/QuotaBadge';
import type { Profile } from '@/lib/types';
import { APP_NAME } from '@/lib/constants';

const NAV = [
  { href: '/fil', label: 'Fil', icon: '🏠' },
  { href: '/reels', label: 'Reels', icon: '🎬' },
  { href: '/messages', label: 'Messages', icon: '💬' },
  { href: '/musique', label: 'Musique', icon: '🎧' },
  { href: '/videos', label: 'Vidéos', icon: '📺' },
  { href: '/livres', label: 'Livres', icon: '📚' },
  { href: '/publier', label: 'Publier', icon: '➕' },
];

export default function AppNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* Barre latérale (ordinateur / tablette) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white p-4 md:flex dark:border-slate-800 dark:bg-slate-950">
        <Link href="/fil" className="px-2 text-2xl font-extrabold text-lify-700">
          {APP_NAME}
        </Link>
        <nav className="mt-6 flex-1 space-y-1" aria-label="Navigation principale">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-lify-50 text-lify-700'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <QuotaBadge />
          <Link
            href={profile ? `/profil/${profile.id}` : '/fil'}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Avatar profile={profile} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {profile?.display_name || 'Mon profil'}
              </p>
              <p className="truncate text-xs text-slate-500">@{profile?.username}</p>
            </div>
          </Link>
          <div className="flex items-center justify-between px-2">
            <Link href="/parametres" className="text-xs text-slate-500 hover:text-lify-700">
              ⚙️ Paramètres
            </Link>
            <button onClick={signOut} className="text-xs text-slate-500 hover:text-red-600">
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Barre basse (mobile ≥360px) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200 bg-white/95 py-1 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95"
        aria-label="Navigation mobile"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            aria-label={item.label}
            className={`flex min-w-12 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium ${
              isActive(item.href) ? 'text-lify-700' : 'text-slate-500'
            }`}
          >
            <span className="text-lg" aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
