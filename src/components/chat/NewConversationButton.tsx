'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

/** Recherche un utilisateur et crée (ou retrouve) une conversation 1-à-1. */
export default function NewConversationButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  const search = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${value.trim()}%`)
      .limit(8);
    setResults((data as Profile[]) ?? []);
    setSearching(false);
  };

  const startConversation = async (otherId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Retrouver une conversation 1-à-1 existante avec ce membre
    const { data: mine } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);
    const { data: theirs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherId);

    const mySet = new Set((mine ?? []).map((m) => m.conversation_id));
    const shared = (theirs ?? []).find((t) => mySet.has(t.conversation_id));

    let conversationId = shared?.conversation_id;
    if (!conversationId) {
      const { data: conv } = await supabase
        .from('conversations')
        .insert({})
        .select('id')
        .single();
      conversationId = conv!.id;
      await supabase.from('conversation_participants').insert([
        { conversation_id: conversationId, user_id: user.id },
        { conversation_id: conversationId, user_id: otherId },
      ]);
    }

    setOpen(false);
    setQuery('');
    setResults([]);
    router.push(`/messages/${conversationId}`);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        ✉️ Nouveau
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20"
          onClick={() => setOpen(false)}
        >
          <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <label htmlFor="user-search" className="label">
              Chercher un membre par identifiant
            </label>
            <input
              id="user-search"
              className="input"
              placeholder="ex. : awa_ndiaye"
              value={query}
              onChange={(e) => search(e.target.value)}
              autoFocus
            />
            {searching && <p className="mt-2 text-sm text-slate-500">Recherche…</p>}
            <ul className="mt-3 space-y-1">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => startConversation(r.id)}
                    className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="font-semibold">{r.display_name || r.username}</span>{' '}
                    <span className="text-slate-500">@{r.username}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
