import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireUser } from '@/lib/auth';
import PublishForm from '@/components/publish/PublishForm';

export const metadata: Metadata = { title: 'Publier' };

export default async function PublierPage() {
  const user = await requireUser('/publier');
  return (
    <Suspense>
      <PublishForm userId={user.id} />
    </Suspense>
  );
}
