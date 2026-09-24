import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import Avatar from '@/components/Avatar';
import { timeAgo } from '@/lib/utils';
import NewConversationButton from '@/components/chat/NewConversationButton';

export const metadata: Metadata = { title: 'Messages' };

export default async function MessagesPage() {
  const user = await requireUser('/messages');
  const supabase = createClient();

  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at, profile:profiles!conversation_participants_user_id_fkey(*)')
    .eq('user_id', user.id)
    .order('last_read_at', { ascending: false });

  const conversationIds = (participants ?? []).map((p) => p.conversation_id);

  const [{ data: messages }, { data: allParticipants }] = await Promise.all([
    conversationIds.length
      ? supabase
          .from('messages')
          .select('conversation_id, content, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    conversationIds.length
      ? supabase
          .from('conversation_participants')
          .select('conversation_id, user_id, profile:profiles!conversation_participants_user_id_fkey(*)')
          .in('conversation_id', conversationIds)
      : Promise.resolve({ data: [] }),
  ]);

  const lastMessageMap = new Map<string, (typeof messages)[number]>();
  for (const m of messages ?? []) {
    if (!lastMessageMap.has(m.conversation_id)) {
      lastMessageMap.set(m.conversation_id, m);
    }
  }

  const othersMap = new Map<string, typeof allParticipants>();
  for (const p of allParticipants ?? []) {
    if (p.user_id === user.id) continue;
    const list = othersMap.get(p.conversation_id) ?? [];
    list.push(p);
    othersMap.set(p.conversation_id, list);
  }

  const rows = (participants ?? []).map((p) => ({
    conversationId: p.conversation_id,
    others: othersMap.get(p.conversation_id) ?? [],
    lastMessage: lastMessageMap.get(p.conversation_id),
  }));

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Messages</h1>
        <NewConversationButton />
      </div>

      {rows.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-4xl">💬</p>
          <h2 className="mt-3 font-semibold">Aucune conversation</h2>
          <p className="mt-1 text-sm text-slate-600">
            Démarrez une discussion 1-à-1 avec un membre de Lify.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {rows.map((row) => (
            <li key={row.conversationId}>
              <Link
                href={`/messages/${row.conversationId}`}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Avatar profile={row.others[0]?.profile} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {row.others
                      .map((o) => o.profile?.display_name || o.profile?.username)
                      .join(', ') || 'Conversation'}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {row.lastMessage
                      ? `${row.lastMessage.content || '📷 Photo'} · ${timeAgo(row.lastMessage.created_at)}`
                      : 'Nouvelle conversation'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
