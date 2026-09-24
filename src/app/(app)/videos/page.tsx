import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import VideoCard from '@/components/media/VideoCard';
import type { MediaContent } from '@/lib/types';

export const metadata: Metadata = { title: 'Vidéos' };

export default async function VideosPage() {
  const user = await requireUser('/videos');
  const supabase = createClient();

  const { data } = await supabase
    .from('media_contents')
    .select('*')
    .eq('category', 'video')
    .order('created_at', { ascending: false })
    .limit(60);

  return (
    <>
      <h1 className="mb-1 text-xl font-bold">Vidéos</h1>
      <p className="mb-4 text-sm text-slate-600">
        Contenus autorisés uniquement : domaine public, Creative Commons,
        créateurs indépendants et partenaires sous contrat.
      </p>

      {(data ?? []).length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-4xl">📺</p>
          <h2 className="mt-3 font-semibold">Pas encore de vidéos</h2>
          <p className="mt-1 text-sm text-slate-600">
            Ajoutez des vidéos sous licence libre depuis la page Publier.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(data ?? []).map((v) => (
            <VideoCard key={v.id} item={v as MediaContent} meId={user.id} />
          ))}
        </div>
      )}
    </>
  );
}
