import type { Metadata } from 'next';
import AppNav from '@/components/AppNav';
import { getCurrentProfile } from '@/lib/auth';

export const metadata: Metadata = {
  title: { default: 'Fil', template: '%s · Lify' },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getCurrentProfile();
  return (
    <div className="min-h-dvh md:pl-64">
      <AppNav profile={profile} />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4 md:pb-10 md:pt-8">
        {children}
      </main>
    </div>
  );
}
