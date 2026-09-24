'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import { INTERESTS } from '@/lib/constants';
import type { Profile } from '@/lib/types';

/** Paramètres du compte : profil, mot de passe, export des données, suppression (V1). */
export default function SettingsClient({
  user,
  profile,
}: {
  user: { id: string; email?: string };
  profile: Profile;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const toggleInterest = (i: string) =>
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const supabase = createClient();

    let avatarUrl = profile.avatar_url;
    if (avatar) {
      const path = `avatars/${user.id}/${Date.now()}-${avatar.name}`;
      const { error: upErr } = await supabase.storage.from('media').upload(path, avatar);
      if (!upErr) {
        avatarUrl = supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
      }
    }

    const { error: err } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        bio,
        interests,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (err) setError(err.message);
    else {
      setSaved(true);
      router.refresh();
    }
    setSaving(false);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordMsg(
      error ? error.message : 'Mot de passe mis à jour. ✅'
    );
    setNewPassword('');
  };

  const exportData = async () => {
    const supabase = createClient();
    const [profileRes, postsRes, messagesRes, favoritesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('posts').select('*').eq('author_id', user.id),
      supabase.from('messages').select('*').eq('sender_id', user.id),
      supabase.from('favorites').select('media_id, created_at').eq('user_id', user.id),
    ]);
    const dump = {
      exported_at: new Date().toISOString(),
      profile: profileRes.data,
      posts: postsRes.data,
      messages: messagesRes.data,
      favorites: favoritesRes.data,
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lify-mes-donnees.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAccount = async () => {
    if (
      !confirm(
        'Supprimer définitivement votre compte et toutes vos données ? Cette action est irréversible.'
      )
    ) {
      return;
    }
    const supabase = createClient();
    // Les lignes liées disparaissent via ON DELETE CASCADE ; l'utilisateur
    // auth est supprimé côté serveur (RPC admin) — ici on nettoie et on se déconnecte.
    await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Paramètres</h1>

      <form onSubmit={saveProfile} className="card mb-6 space-y-4 p-6">
        <h2 className="font-semibold">Profil</h2>

        <div className="flex items-center gap-4">
          <Avatar profile={profile} size={64} linked={false} />
          <div>
            <label htmlFor="avatar" className="label">Photo de profil</label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              className="input"
              onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="s-name" className="label">Nom affiché</label>
          <input
            id="s-name"
            className="input"
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="s-bio" className="label">Biographie</label>
          <textarea
            id="s-bio"
            className="input min-h-20"
            maxLength={300}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Parlez de vous…"
          />
        </div>

        <fieldset>
          <legend className="label">Centres d&apos;intérêt</legend>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button
                key={i}
                type="button"
                aria-pressed={interests.includes(i)}
                onClick={() => toggleInterest(i)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  interests.includes(i)
                    ? 'bg-lify-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </fieldset>

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {saved && (
          <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
            Profil enregistré. ✅
          </p>
        )}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>

      <form onSubmit={changePassword} className="card mb-6 space-y-4 p-6">
        <h2 className="font-semibold">Mot de passe</h2>
        <p className="text-xs text-slate-500">Connecté avec : {user.email}</p>
        <div>
          <label htmlFor="s-pass" className="label">Nouveau mot de passe</label>
          <input
            id="s-pass"
            type="password"
            className="input"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="8 caractères minimum"
          />
        </div>
        {passwordMsg && <p className="text-sm text-lify-700">{passwordMsg}</p>}
        <button type="submit" className="btn-ghost">
          Mettre à jour le mot de passe
        </button>
      </form>

      <div className="card mb-6 space-y-4 p-6">
        <h2 className="font-semibold">Mes données</h2>
        <p className="text-sm text-slate-600">
          Vous pouvez à tout moment exporter vos données ou supprimer votre
          compte (règlement sur la vie privée, données minimales collectées).
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportData} className="btn-ghost">
            ⬇️ Exporter mes données
          </button>
          <button onClick={deleteAccount} className="btn bg-red-600 text-white hover:bg-red-700">
            🗑 Supprimer mon compte
          </button>
        </div>
      </div>

      <div className="card space-y-2 p-6 text-sm">
        <h2 className="font-semibold">Informations légales</h2>
        <Link href="/legal/conditions" className="block text-lify-700 hover:underline">
          Conditions d&apos;utilisation
        </Link>
        <Link href="/legal/confidentialite" className="block text-lify-700 hover:underline">
          Politique de confidentialité
        </Link>
        <Link href="/legal/regles-de-conduite" className="block text-lify-700 hover:underline">
          Règles de conduite et modération
        </Link>
      </div>
    </div>
  );
}
