'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/parametres`,
    });
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-3xl">🔐</p>
        <h1 className="mt-3 text-xl font-bold">Email envoyé</h1>
        <p className="mt-2 text-sm text-slate-600">
          Si un compte existe pour {email}, vous recevrez un lien pour
          réinitialiser votre mot de passe.
        </p>
        <Link href="/connexion" className="btn-primary mt-6 w-full">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-slate-600">
          Indiquez votre email, nous vous enverrons un lien de réinitialisation.
        </p>
        <form onSubmit={handleReset} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href="/connexion" className="text-lify-700 hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
