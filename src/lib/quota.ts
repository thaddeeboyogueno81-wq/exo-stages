import { createClient } from '@/lib/supabase/client';

/**
 * Tente de consommer un quota du mode gratuit.
 * @returns true si l'action est autorisée, false si le quota est atteint.
 */
export async function consumeQuota(kind: 'media' | 'book'): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('consume_quota', { p_kind: kind });
  if (error) {
    console.error('consume_quota', error);
    return false;
  }
  return Boolean(data);
}

/** Consommation du jour pour l'interface (badge de quota). */
export async function fetchTodayUsage() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('today_usage');
  if (error || !data || data.length === 0) {
    return { media_plays: 0, media_limit: 20, books_opened: 0, books_limit: 3 };
  }
  return data[0];
}
