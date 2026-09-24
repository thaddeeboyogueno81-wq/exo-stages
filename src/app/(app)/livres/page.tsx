import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import type { MediaContent } from '@/lib/types';

export const metadata: Metadata = { title: 'Livres' };

export default async function LivresPage() {
  const user = await requireUser('/livres');
  const supabase = createClient();

  const [{ data: books }, { data: progress }] = await Promise.all([
    supabase
      .from('media_contents')
      .select('*')
      .eq('category', 'book')
      .order('title', { ascending: true }),
    supabase.from('reading_progress').select('media_id, position').eq('user_id', user.id),
  ]);

  const progressMap = new Map(
    (progress ?? []).map((p) => [p.media_id, p.position])
  );

  return (
    <>
      <h1 className="mb-1 text-xl font-bold">Bibliothèque</h1>
      <p className="mb-4 text-sm text-slate-600">
        Livres du domaine public ou sous licence libre. Mode gratuit :
        3 nouveaux livres par mois, lecture en ligne.
      </p>

      {(books ?? []).length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-4xl">📚</p>
          <h2 className="mt-3 font-semibold">Aucun livre pour l&apos;instant</h2>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {(books ?? []).map((b) => {
            const p = progressMap.get(b.id);
            const book = b as MediaContent;
            return (
              <li key={b.id}>
                <Link
                  href={`/livres/${book.id}`}
                  className="card block p-5 transition-colors hover:border-lify-400"
                >
                  <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-lify-50 text-4xl">
                    📖
                  </div>
                  <h2 className="text-sm font-semibold">{book.title}</h2>
                  <p className="text-xs text-slate-500">
                    {book.creator_credit} · {book.license}
                  </p>
                  {p !== undefined && p > 0 && (
                    <p className="mt-2 text-xs font-medium text-lify-700">
                      ▶ Reprendre au chapitre {p + 1}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
