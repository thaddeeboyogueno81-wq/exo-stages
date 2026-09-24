'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/** Ouvre (ou retrouve) une conversation 1-à-1 depuis un profil. */
export default function MessageButton({ targetId }: { targetId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const open = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: mine } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);
    const { data: theirs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', targetId);

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
        { conversation_id: conversationId, user_id: targetId },
      ]);
    }
    router.push(`/messages/${conversationId}`);
  };

  return (
    <button onClick={open} disabled={loading} className="btn-ghost">
      💬 Message
    </button>
  );
}
