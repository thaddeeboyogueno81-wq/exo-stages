import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Profile } from '@/lib/types';

/** Récupère l'utilisateur connecté ou redirige vers /connexion. */
export async function requireUser(redirectTo = '/fil') {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.getUser();
  if (!user) redirect('/connexion?redirect=' + encodeURIComponent(redirectTo));
  return user;
}

/** Récupère le profil lié à l'utilisateur connecté. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data as Profile | null;
}

export async function getCurrentProfile() {
  const user = await requireUser();
  return { user, profile: await getProfile(user.id) };
}
