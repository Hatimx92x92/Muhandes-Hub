// =============================================================================
// Muhandes HUB — Realtime Messaging Hook
// Handles message streaming + typing indicators via Supabase Realtime
// =============================================================================

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
}

interface UseRealtimeMessagesOptions {
  conversationId: string;
  currentUserId: string;
  /** Initial messages loaded server-side */
  initialMessages?: Message[];
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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  // Update messages when initialMessages change (e.g., page navigation)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase.channel(`messages:${conversationId}`, {
      config: { presence: { key: currentUserId } },
    });

    // Listen for new messages
    channel.on(
      'postgres_changes' as unknown as 'system',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      } as unknown as { event: string },
      (payload: { new: Message }) => {
        const newMsg = payload.new;
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // Clear typing indicator for sender
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(newMsg.sender_id);
          return next;
        });
      },
    );

    // Listen for soft-deletes
    channel.on(
      'postgres_changes' as unknown as 'system',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      } as unknown as { event: string },
      (payload: { new: Message }) => {
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

      // Clear after timeout
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
      // Clear all typing timers
      typingTimersRef.current.forEach((timer) => clearTimeout(timer));
      typingTimersRef.current.clear();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, currentUserId]);

  /**
   * Broadcast a typing indicator to the other participant.
   * Call this on every keystroke (debounce externally if desired).
   */
  const sendTypingIndicator = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: currentUserId },
      });
    }
  }, [currentUserId]);

  return {
    messages: messages.filter((m) => !m.deleted_at),
    typingUsers: Array.from(typingUsers),
    sendTypingIndicator,
  };
}
