import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import ChatWindow from '@/components/chat/ChatWindow';

export const metadata: Metadata = { title: 'Conversation' };

export default async function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const user = await requireUser(`/messages/${params.conversationId}`);
  const supabase = createClient();

  // Vérifier que l'utilisateur participe à la conversation
  const { data: meParticipant } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .match({ conversation_id: params.conversationId, user_id: user.id })
    .maybeSingle();

  if (!meParticipant) notFound();

  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id, profile:profiles!conversation_participants_user_id_fkey(*)')
    .eq('conversation_id', params.conversationId);

  const { data: initialMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', params.conversationId)
    .order('created_at', { ascending: true })
    .limit(200);

  const other = (participants ?? []).find((p) => p.user_id !== user.id);

  return (
    <ChatWindow
      conversationId={params.conversationId}
      meId={user.id}
      otherProfile={other?.profile ?? null}
      initialMessages={initialMessages ?? []}
    />
  );
}
