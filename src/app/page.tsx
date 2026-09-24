import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  // Un utilisateur connecté va directement au fil.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.getUser();
  if (user) redirect('/fil');

  const features = [
    {
      title: '💬 Messagerie',
      text: 'Discutez en temps réel, seul ou en groupe, avec textes et photos.',
    },
    {
      title: '📱 Stories & reels',
      text: 'Des stories qui disparaissent après 24 h et des vidéos courtes.',
    },
    {
      title: '🎧 Musique & vidéo',
      text: 'Un catalogue de contenus libres de droits et de créateurs indépendants.',
    },
    {
      title: '📚 Livres',
      text: 'Une bibliothèque du domaine public avec lecteur confortable et reprise de lecture.',
    },
    {
      title: '📶 Mode gratuit limité',
      text: 'Messagerie et fil illimités, quotas de lecture et d\u2019écoute — ça marche même avec une connexion faible.',
    },
    {
      title: '⬇️ Installable',
      text: 'Installez Lify depuis votre navigateur : pages déjà vues consultables hors-ligne.',
    },
  ];

  return (
    <main className="min-h-dvh bg-gradient-to-b from-lify-50 via-white to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-xl font-extrabold text-lify-700">{APP_NAME}</span>
        <nav className="flex gap-3">
          <Link href="/connexion" className="btn-ghost">
            Se connecter
          </Link>
          <Link href="/inscription" className="btn-primary">
            Créer un compte
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
          {APP_TAGLINE}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Un compte unique, un accès gratuit limité, et la même expérience sur
          téléphone, tablette et ordinateur. Des contenus libres de droits et
          des créateurs indépendants mis en avant.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/inscription" className="btn-primary px-6 py-3 text-base">
            Commencer gratuitement
          </Link>
          <Link href="/connexion" className="btn-ghost px-6 py-3 text-base">
            J&apos;ai déjà un compte
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card p-6 text-left">
            <h2 className="text-lg font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/legal/regles-de-conduite" className="hover:underline">
            Règles de conduite
          </Link>
          <Link href="/legal/conditions" className="hover:underline">
            Conditions d&apos;utilisation
          </Link>
          <Link href="/legal/confidentialite" className="hover:underline">
            Confidentialité
          </Link>
        </div>
        <p className="mt-4">© {new Date().getFullYear()} {APP_NAME}. Contenus diffusés sous licence uniquement.</p>
      </footer>
    </main>
  );
}
