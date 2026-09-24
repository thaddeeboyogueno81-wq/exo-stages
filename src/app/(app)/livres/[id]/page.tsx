import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import BookReader from '@/components/media/BookReader';
import type { MediaContent } from '@/lib/types';

export const metadata: Metadata = { title: 'Lecture' };

export default async function BookPage({ params }: { params: { id: string } }) {
  const user = await requireUser(`/livres/${params.id}`);
  const supabase = createClient();

  const { data: book } = await supabase
    .from('media_contents')
    .select('*')
    .eq('id', params.id)
    .eq('category', 'book')
    .maybeSingle();

  if (!book) notFound();

  const { data: prog } = await supabase
    .from('reading_progress')
    .select('position')
    .match({ user_id: user.id, media_id: params.id })
    .maybeSingle();

  return (
    <BookReader
      book={book as MediaContent}
      meId={user.id}
      initialPosition={prog?.position ?? 0}
    />
  );
}
