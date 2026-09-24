'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import { timeAgo } from '@/lib/utils';
import type { Message, Profile } from '@/lib/types';

/** Conversation 1-à-1 en temps réel (Supabase Realtime) avec texte et photos. */
export default function ChatWindow({
  conversationId,
  meId,
  otherProfile,
  initialMessages,
}: {
  conversationId: string;
  meId: string;
  otherProfile: Profile | null;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef(createClient());

  const supabase = supabaseRef.current;

  // Abonnement temps réel
  useEffect(() => {
    const channel = supabase
      .channel('conv-' + conversationId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
          // Marquer comme lu et mettre à jour last_read_at
          supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', payload.new.id)
            .is('read_at', null)
            .neq('sender_id', meId);
          supabase
            .from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .match({ conversation_id: conversationId, user_id: meId });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, meId, supabase]);

  // Défiler vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText('');
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: meId,
      content,
    });
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .match({ conversation_id: conversationId, user_id: meId });
    setSending(false);
  };

  const sendPhoto = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const path = `messages/${conversationId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('media').upload(path, file);
    if (error) return;
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: meId,
      content: '',
      image_url: data.publicUrl,
    });
  };

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col md:h-[calc(100dvh-9rem)]">
      <header className="flex items-center gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <Link href="/messages" aria-label="Retour" className="text-slate-500 md:hidden">
          ←
        </Link>
        <Avatar profile={otherProfile} size={40} />
        <div>
          <p className="text-sm font-semibold">
            {otherProfile?.display_name || otherProfile?.username || 'Conversation'}
          </p>
          <p className="text-xs text-slate-500">
            {messages.length > 0 && 'En ligne · temps réel'}
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-slate-500">
            Envoyez le premier message à{' '}
            {otherProfile?.display_name || 'votre contact'} 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine
                    ? 'rounded-br-md bg-lify-600 text-white'
                    : 'rounded-bl-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                }`}
              >
                {m.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.image_url}
                    alt="Photo envoyée"
                    className="mb-1 max-h-64 rounded-lg object-cover"
                    loading="lazy"
                  />
                )}
                {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                <p
                  className={`mt-0.5 text-right text-[10px] ${
                    mine ? 'text-lify-100' : 'text-slate-400'
                  }`}
                >
                  {timeAgo(m.created_at)}
                  {mine && (m.read_at ? ' · Lu' : ' · Envoyé')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="flex items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) sendPhoto(f);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Envoyer une photo"
          className="btn-ghost px-3"
        >
          📷
        </button>
        <label htmlFor="chat-input" className="sr-only">
          Votre message
        </label>
        <input
          id="chat-input"
          className="input flex-1"
          placeholder="Écrivez un message…"
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={sending || !text.trim()} className="btn-primary px-4">
          ➤
        </button>
      </form>
    </div>
  );
}
