'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GoogleButton from '@/components/GoogleButton';
import { INTERESTS, RULES } from '@/lib/constants';

export default function RegisterForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const toggleInterest = (i: string) =>
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accepted) {
      setError('Vous devez accepter les conditions et la politique de confidentialité.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Session directe : on crée/complete le profil puis redirection.
      await supabase.from('profiles').upsert({
        id: data.user!.id,
        username,
        display_name: displayName,
        interests,
      });
      router.push('/fil');
      router.refresh();
      return;
    }

    setNeedsConfirmation(true);
    setLoading(false);
  };

  if (needsConfirmation) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-3xl">✉️</p>
        <h1 className="mt-3 text-xl font-bold">Vérifiez votre boîte mail</h1>
        <p className="mt-2 text-sm text-slate-600">
          Nous avons envoyé un lien de confirmation à <strong>{email}</strong>.
          Cliquez dessus pour activer votre compte, puis connectez-vous.
        </p>
        <Link href="/connexion" className="btn-primary mt-6 w-full">
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Créer un compte</h1>
        <p className="mt-1 text-sm text-slate-600">
          Gratuit, avec quotas de lecture et d&apos;écoute. Réservé aux {RULES.minAge} ans et plus.
        </p>

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div>
            <label htmlFor="displayName" className="label">Nom affiché</label>
            <input
              id="displayName"
              className="input"
              required
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex. : Awa Ndiaye"
            />
          </div>
          <div>
            <label htmlFor="username" className="label">Identifiant</label>
            <input
              id="username"
              className="input"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="awa_ndiaye"
            />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              required
              autoComplete="email"
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
              className="input"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
            />
          </div>

          <fieldset>
            <legend className="label">Centres d&apos;intérêt (facultatif)</legend>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={interests.includes(i)}
                  onClick={() => toggleInterest(i)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    interests.includes(i)
                      ? 'bg-lify-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              J&apos;ai {RULES.minAge} ans ou plus et j&apos;accepte les{' '}
              <Link href="/legal/conditions" className="text-lify-700 underline">conditions d&apos;utilisation</Link> et la{' '}
              <Link href="/legal/confidentialite" className="text-lify-700 underline">politique de confidentialité</Link>.
            </span>
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> ou <span className="h-px flex-1 bg-slate-200" />
        </div>

        <GoogleButton label="S'inscrire avec Google" />
        <p className="mt-6 text-center text-sm">
          Déjà un compte ?{' '}
          <Link href="/connexion" className="text-lify-700 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
