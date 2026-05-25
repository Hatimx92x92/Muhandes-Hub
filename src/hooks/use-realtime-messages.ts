// =============================================================================
// Muhandes HUB — Realtime Messaging Hook
// Handles message streaming + typing indicators via Supabase Realtime
// =============================================================================

'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface RealtimeMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  attachments?: Array<{ url: string; name: string; size: number; mimeType: string }> | null;
}

interface UseRealtimeMessagesOptions {
  conversationId: string;
  currentUserId: string;
  /** Initial messages loaded server-side */
  initialMessages?: RealtimeMessage[];
}

const TYPING_TIMEOUT_MS = 3000;

/**
 * Subscribe to real-time messages in a conversation.
 * Returns live messages array and typing state.
 */
export function useRealtimeMessages({
  conversationId,
  currentUserId,
  initialMessages = [],
}: UseRealtimeMessagesOptions) {
  const [messages, setMessages] = useState<RealtimeMessage[]>(initialMessages);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  // Stable client instance — never recreated during the component's lifetime
  const supabase = useMemo(() => createClient(), []);

  // Sync initial messages when they change (e.g., after async load)
  useEffect(() => {
    setMessages(initialMessages);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessages.length]);

  useEffect(() => {
    // Don't subscribe until we have a real conversation ID
    if (!conversationId) return;

    const channel = supabase.channel(`conv:${conversationId}`, {
      config: { presence: { key: currentUserId } },
    });

    // Listen for new messages via postgres_changes
    channel.on(
        'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: { new: RealtimeMessage }) => {
        const newMsg = payload.new;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(newMsg.sender_id);
          return next;
        });
      },
    );

    // Listen for soft-deletes
    channel.on(
        'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: { new: RealtimeMessage }) => {
        const updated = payload.new;
        setMessages((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m)),
        );
      },
    );

    // Typing indicator via broadcast
    channel.on('broadcast', { event: 'typing' }, (payload: { payload: { user_id: string } }) => {
      const userId = payload.payload?.user_id;
      if (!userId || userId === currentUserId) return;

      setTypingUsers((prev) => new Set(prev).add(userId));

      const existing = typingTimersRef.current.get(userId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        typingTimersRef.current.delete(userId);
      }, TYPING_TIMEOUT_MS);

      typingTimersRef.current.set(userId, timer);
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      typingTimersRef.current.forEach((timer) => clearTimeout(timer));
      typingTimersRef.current.clear();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, currentUserId, supabase]);

  /**
   * Broadcast a typing indicator to the other participant.
   */
  const sendTypingIndicator = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId },
    });
  }, [currentUserId]);

  return {
    messages: messages.filter((m) => !m.deleted_at),
    typingUsers: Array.from(typingUsers),
    sendTypingIndicator,
  };
}
