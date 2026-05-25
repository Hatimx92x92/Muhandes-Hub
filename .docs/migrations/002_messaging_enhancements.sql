-- =============================================================================
-- Migration 002: Messaging Enhancements
-- =============================================================================

-- 1. Add deleted_at to messages (used by deleteMessage action — was missing from schema)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Add attachments JSONB for multiple files per message
--    Array of { url: string, name: string, size: number, mimeType: string }
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]';

-- 3. Remove the "must have context" constraint — allow direct messages without entity
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversation_has_context;

-- 4. Add increment_unread_count RPC (called in sendMessage action but was missing)
CREATE OR REPLACE FUNCTION increment_unread_count(p_conversation_id UUID, p_sender_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = p_conversation_id
    AND user_id != p_sender_id;
END;
$$;

-- 5. Enable Supabase Realtime publications
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
