'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RULES } from '@/lib/constants';

type Tab = 'story' | 'reel' | 'media';

export default function PublishForm({ userId }: { userId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(
    params.get('type') === 'story' ? 'story' : 'story'
  );

  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [credit, setCredit] = useState('');
  const [license, setLicense] = useState('Creative Commons');
  const [category, setCategory] = useState<'music' | 'video' | 'book'>('music');
  const [mediaUrl, setMediaUrl] = useState('');
  const [bookUrl, setBookUrl] = useState('');
  const [declaration, setDeclaration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadToStorage = (f: File) => {
    const supabase = createClient();
    const path = `posts/${userId}/${Date.now()}-${f.name}`;
    return supabase.storage
      .from('media')
      .upload(path, f)
      .then(({ error: err }) => {
        if (err) throw err;
        return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
      });
  };

  const publishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Choisissez une image ou une vidéo.');
      return;
    }
    if (file.size > RULES.maxUploadMb * 1024 * 1024) {
      setError(`Fichier trop lourd : maximum ${RULES.maxUploadMb} Mo.`);
      return;
    }
    setLoading(true);
    try {
      const url = await uploadToStorage(file);
      const supabase = createClient();
      const mediaKind = file.type.startsWith('video') ? 'video' : 'image';
      if (tab === 'reel' && mediaKind !== 'video') {
        setError('Un reel doit être une vidéo.');
        setLoading(false);
        return;
      }
      const { error: insertError } = await supabase.from('posts').insert({
        author_id: userId,
        type: tab === 'story' ? 'story' : 'reel',
        caption: caption.slice(0, RULES.maxCaptionLength),
        media_url: url,
        media_kind: mediaKind,
        ...(tab === 'story'
          ? {
              expires_at: new Date(
                Date.now() + RULES.storyDurationHours * 3600 * 1000
              ).toISOString(),
            }
          : {}),
      });
      if (insertError) throw insertError;
      router.push(tab === 'story' ? '/fil' : '/reels');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const publishMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!declaration) {
      setError('Vous devez déclarer détenir les droits sur ce contenu (règle §6 du cahier des charges).');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from('media_contents').insert({
        title,
        creator_credit: credit,
        category,
        description: caption.slice(0, 500),
        license,
        media_kind: category === 'video' ? 'video' : 'audio',
        media_url: mediaUrl || 'about:blank',
        book_url: category === 'book' ? bookUrl : null,
        uploader_id: userId,
      });
      if (insertError) throw insertError;
      router.push(category === 'book' ? '/livres' : category === 'video' ? '/videos' : '/musique');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'story', label: '📸 Story (24 h)' },
    { key: 'reel', label: '🎬 Reel' },
    { key: 'media', label: '🎵 Ajouter au catalogue' },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Publier</h1>

      <div role="tablist" className="mb-5 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setTab(t.key);
              setError(null);
            }}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
              tab === t.key
                ? 'bg-lify-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {tab !== 'media' ? (
        <form onSubmit={publishPost} className="card space-y-4 p-6">
          <div>
            <label htmlFor="pub-file" className="label">
              {tab === 'story' ? 'Image ou vidéo' : 'Vidéo courte'}
            </label>
            <input
              id="pub-file"
              type="file"
              accept={tab === 'reel' ? 'video/*' : 'image/*,video/*'}
              required
              className="input"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Maximum {RULES.maxUploadMb} Mo. Les stories disparaissent après{' '}
              {RULES.storyDurationHours} h.
            </p>
          </div>
          <div>
            <label htmlFor="pub-caption" className="label">Légende</label>
            <textarea
              id="pub-caption"
              className="input min-h-24"
              maxLength={RULES.maxCaptionLength}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Dites quelque chose à propos de votre publication…"
            />
          </div>
          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={declaration}
              onChange={(e) => setDeclaration(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Je déclare détenir les droits sur ce contenu ou qu&apos;il relève du
              domaine public / d&apos;une licence libre. Les contenus protégés sans
              droits sont interdits et retirés sous 48 h.
            </span>
          </label>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Publication…' : `Publier ${tab === 'story' ? 'la story' : 'le reel'}`}
          </button>
        </form>
      ) : (
        <form onSubmit={publishMedia} className="card space-y-4 p-6">
          <div>
            <label htmlFor="m-cat" className="label">Type de contenu</label>
            <select
              id="m-cat"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
            >
              <option value="music">Musique</option>
              <option value="video">Vidéo</option>
              <option value="book">Livre</option>
            </select>
          </div>
          <div>
            <label htmlFor="m-title" className="label">Titre</label>
            <input
              id="m-title"
              className="input"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="m-credit" className="label">Créateur / interprète</label>
            <input
              id="m-credit"
              className="input"
              required
              maxLength={120}
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              placeholder="Ex. : Camille Saint-Saëns (interprète XYZ)"
            />
          </div>
          <div>
            <label htmlFor="m-license" className="label">Licence</label>
            <select
              id="m-license"
              className="input"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
            >
              <option>Domaine public</option>
              <option>Creative Commons</option>
              <option>Créateur indépendant</option>
              <option>Partenaire</option>
            </select>
          </div>
          <div>
            <label htmlFor="m-url" className="label">
              URL du fichier audio/vidéo
            </label>
            <input
              id="m-url"
              type="url"
              className="input"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          {category === 'book' && (
            <div>
              <label htmlFor="m-book" className="label">URL du texte intégral</label>
              <input
                id="m-book"
                type="url"
                className="input"
                required
                value={bookUrl}
                onChange={(e) => setBookUrl(e.target.value)}
                placeholder="https://… (fichier .txt)"
              />
            </div>
          )}
          <div>
            <label htmlFor="m-desc" className="label">Description</label>
            <textarea
              id="m-desc"
              className="input min-h-20"
              maxLength={500}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={declaration}
              onChange={(e) => setDeclaration(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Je certifie que la licence de ce contenu autorise sa diffusion sur
              Lify (domaine public, Creative Commons, accord du créateur ou contrat).
            </span>
          </label>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Ajout…' : 'Ajouter au catalogue'}
          </button>
        </form>
      )}
    </div>
  );
}
