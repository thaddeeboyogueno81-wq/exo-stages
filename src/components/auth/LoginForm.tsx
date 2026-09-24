'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GoogleButton from '@/components/GoogleButton';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirect') ?? '/fil';
  const errorParam = params.get('erreur');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : error.message
      );
      setLoading(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Bon retour 👋</h1>
        <p className="mt-1 text-sm text-slate-600">
          Connectez-vous pour retrouver vos conversations et contenus.
        </p>

        {errorParam === 'auth' && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            La connexion a échoué. Réessayez.
          </p>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Mot de passe</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> ou <span className="h-px flex-1 bg-slate-200" />
        </div>

        <GoogleButton label="Continuer avec Google" />

        <div className="mt-6 flex justify-between text-sm">
          <Link href="/mot-de-passe-oublie" className="text-lify-700 hover:underline">
            Mot de passe oublié ?
          </Link>
          <Link href="/inscription" className="text-lify-700 hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
