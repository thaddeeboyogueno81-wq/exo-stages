import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import SettingsClient from '@/components/settings/SettingsClient';

export const metadata: Metadata = { title: 'Paramètres' };

export default async function ParametresPage() {
  const { user, profile } = await getCurrentProfile();
  if (!profile) redirect('/connexion');
  return <SettingsClient user={user} profile={profile} />;
}
