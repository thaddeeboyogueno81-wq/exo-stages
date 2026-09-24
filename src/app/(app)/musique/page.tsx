import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import AudioPlayer from '@/components/media/AudioPlayer';
import type { MediaContent } from '@/lib/types';

export const metadata: Metadata = { title: 'Musique' };

export default async function MusiquePage() {
  const user = await requireUser('/musique');
  const supabase = createClient();

  const [{ data: catalog }, { data: favs }] = await Promise.all([
    supabase
      .from('media_contents')
      .select('*')
      .eq('category', 'music')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('favorites').select('media_id').eq('user_id', user.id),
  ]);

  const favSet = new Set((favs ?? []).map((f) => f.media_id));
  const items = (catalog ?? []).map((c) => ({ ...c, is_favorite: favSet.has(c.id) }));

  return (
    <>
      <h1 className="mb-1 text-xl font-bold">Musique</h1>
      <p className="mb-4 text-sm text-slate-600">
        Catalogue de contenus libres de droits et de créateurs indépendants.
        Quota : 20 écoutes par jour en mode gratuit.
      </p>

      {items.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-4xl">🎧</p>
          <h2 className="mt-3 font-semibold">Catalogue vide</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ajoutez des titres sous licence libre depuis la page Publier.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <AudioPlayer key={item.id} item={item as MediaContent} meId={user.id} />
          ))}
        </div>
      )}
    </>
  );
}
