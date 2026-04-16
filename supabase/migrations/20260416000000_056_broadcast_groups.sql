-- Migration: 056_broadcast_groups
-- Description: Add broadcast group functionality for mass DM-style messaging
-- 
-- Feature: Broadcast Groups (WhatsApp-style)
-- A broadcast group appears as a conversation in the creator's chat list.
-- When the creator sends a message in this conversation:
--   - Each recipient receives it as an individual DM
--   - Recipients can reply privately (goes to their DM with creator)
--   - Recipients don't see other recipients or know they're in a broadcast
--
-- Architecture:
-- 1. Broadcast conversation appears in creator's conversation list
-- 2. Messages sent to broadcast conversation are stored there (for creator's history)
-- 3. Trigger automatically sends each message as individual DMs to recipients
-- 4. Recipients see messages in their personal DM with the creator

-- ============================================================================
-- Update conversations table to support broadcast metadata
-- ============================================================================

-- Add broadcast_recipient_ids column to store recipients for broadcast conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS broadcast_recipient_ids uuid[] DEFAULT NULL;

-- Add index for broadcast conversations
CREATE INDEX IF NOT EXISTS idx_conversations_broadcast_recipients
  ON conversations USING GIN(broadcast_recipient_ids)
  WHERE type = 'broadcast';

-- Add index for broadcast conversations
CREATE INDEX IF NOT EXISTS idx_conversations_broadcast_recipients
  ON conversations USING GIN(broadcast_recipient_ids)
  WHERE type = 'broadcast';

-- ============================================================================
-- RLS Policies for broadcast conversations
-- ============================================================================

-- Creator can view their broadcast conversations
-- (Already covered by existing conversation policies)

-- ============================================================================
-- Trigger: Broadcast messages to individual DMs
-- ============================================================================

CREATE OR REPLACE FUNCTION broadcast_message_to_recipients()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation conversations;
  v_recipient_id uuid;
  v_dm_conversation_id uuid;
BEGIN
  -- Get the conversation details
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = NEW.conversation_id
    AND type = 'broadcast';

  -- If not a broadcast conversation, do nothing
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- If no recipients, do nothing
  IF v_conversation.broadcast_recipient_ids IS NULL OR 
     array_length(v_conversation.broadcast_recipient_ids, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Loop through each recipient and send as individual DM
  FOREACH v_recipient_id IN ARRAY v_conversation.broadcast_recipient_ids
  LOOP
    BEGIN
      -- Get or create direct conversation with this recipient
      SELECT get_or_create_direct_conversation(NEW.sender_id, v_recipient_id)
      INTO v_dm_conversation_id;

      -- Insert message into the recipient's DM conversation
      INSERT INTO messages (
        conversation_id,
        sender_id,
        content,
        encrypted_content,
        expires_at
      )
      VALUES (
        v_dm_conversation_id,
        NEW.sender_id,
        NEW.content,
        NEW.encrypted_content,
        NEW.expires_at
      );

    EXCEPTION WHEN OTHERS THEN
      -- Log failure but continue with other recipients
      RAISE WARNING 'Failed to broadcast to recipient %: %', v_recipient_id, SQLERRM;
    END;
  END LOOP;

  -- Return the original message (stored in broadcast conversation for creator's history)
  RETURN NEW;
END;
$$;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS trg_broadcast_message_to_recipients ON messages;
CREATE TRIGGER trg_broadcast_message_to_recipients
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_message_to_recipients();

COMMENT ON FUNCTION broadcast_message_to_recipients IS 
  'Automatically broadcasts messages sent to broadcast conversations as individual DMs to all recipients';

-- ============================================================================
-- Function: Create broadcast conversation
-- ============================================================================

CREATE OR REPLACE FUNCTION create_broadcast_conversation(
  p_name text,
  p_creator_id uuid,
  p_recipient_ids uuid[],
  p_avatar_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Validate inputs
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Broadcast name is required';
  END IF;

  IF p_recipient_ids IS NULL OR array_length(p_recipient_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one recipient is required';
  END IF;

  IF array_length(p_recipient_ids, 1) > 500 THEN
    RAISE EXCEPTION 'Maximum 500 recipients allowed';
  END IF;

  -- Create broadcast conversation
  INSERT INTO conversations (
    type,
    name,
    avatar_url,
    created_by,
    broadcast_recipient_ids
  )
  VALUES (
    'broadcast',
    trim(p_name),
    p_avatar_url,
    p_creator_id,
    p_recipient_ids
  )
  RETURNING id INTO v_conversation_id;

  -- Add creator as the only participant (recipients are not participants)
  INSERT INTO conversation_participants (
    conversation_id,
    user_id,
    is_admin,
    is_creator
  )
  VALUES (
    v_conversation_id,
    p_creator_id,
    true,
    true
  );

  RETURN v_conversation_id;
END;
$$;

COMMENT ON FUNCTION create_broadcast_conversation IS 
  'Creates a broadcast conversation that appears in creator''s chat list. Messages sent here are automatically broadcast as individual DMs to all recipients.';

-- ============================================================================
-- Function: Update broadcast recipients
-- ============================================================================

CREATE OR REPLACE FUNCTION update_broadcast_recipients(
  p_conversation_id uuid,
  p_creator_id uuid,
  p_recipient_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate the user is the creator
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = p_conversation_id
      AND type = 'broadcast'
      AND created_by = p_creator_id
  ) THEN
    RAISE EXCEPTION 'Broadcast conversation not found or unauthorized';
  END IF;

  -- Validate recipient count
  IF p_recipient_ids IS NULL OR array_length(p_recipient_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one recipient is required';
  END IF;

  IF array_length(p_recipient_ids, 1) > 500 THEN
    RAISE EXCEPTION 'Maximum 500 recipients allowed';
  END IF;

  -- Update recipients
  UPDATE conversations
  SET broadcast_recipient_ids = p_recipient_ids,
      updated_at = now()
  WHERE id = p_conversation_id;
END;
$$;

COMMENT ON FUNCTION update_broadcast_recipients IS 
  'Updates the recipient list for a broadcast conversation. Only the creator can update recipients.';

-- ============================================================================
-- Function: Add recipients to broadcast
-- ============================================================================

CREATE OR REPLACE FUNCTION add_broadcast_recipients(
  p_conversation_id uuid,
  p_creator_id uuid,
  p_new_recipient_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_recipients uuid[];
  v_updated_recipients uuid[];
BEGIN
  -- Get current recipients
  SELECT broadcast_recipient_ids INTO v_current_recipients
  FROM conversations
  WHERE id = p_conversation_id
    AND type = 'broadcast'
    AND created_by = p_creator_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Broadcast conversation not found or unauthorized';
  END IF;

  -- Merge and deduplicate recipients
  v_updated_recipients := ARRAY(
    SELECT DISTINCT unnest(COALESCE(v_current_recipients, '{}') || p_new_recipient_ids)
  );

  -- Validate recipient count
  IF array_length(v_updated_recipients, 1) > 500 THEN
    RAISE EXCEPTION 'Maximum 500 recipients allowed';
  END IF;

  -- Update the conversation
  UPDATE conversations
  SET broadcast_recipient_ids = v_updated_recipients,
      updated_at = now()
  WHERE id = p_conversation_id;
END;
$$;

COMMENT ON FUNCTION add_broadcast_recipients IS 
  'Adds new recipients to a broadcast conversation. Only the creator can add recipients.';

-- ============================================================================
-- Function: Remove recipients from broadcast
-- ============================================================================

CREATE OR REPLACE FUNCTION remove_broadcast_recipients(
  p_conversation_id uuid,
  p_creator_id uuid,
  p_remove_recipient_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_recipients uuid[];
  v_updated_recipients uuid[];
BEGIN
  -- Get current recipients
  SELECT broadcast_recipient_ids INTO v_current_recipients
  FROM conversations
  WHERE id = p_conversation_id
    AND type = 'broadcast'
    AND created_by = p_creator_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Broadcast conversation not found or unauthorized';
  END IF;

  -- Remove specified recipients
  v_updated_recipients := ARRAY(
    SELECT unnest(v_current_recipients)
    EXCEPT
    SELECT unnest(p_remove_recipient_ids)
  );

  -- Validate at least one recipient remains
  IF v_updated_recipients IS NULL OR array_length(v_updated_recipients, 1) IS NULL THEN
    RAISE EXCEPTION 'Broadcast must have at least one recipient';
  END IF;

  -- Update the conversation
  UPDATE conversations
  SET broadcast_recipient_ids = v_updated_recipients,
      updated_at = now()
  WHERE id = p_conversation_id;
END;
$$;

COMMENT ON FUNCTION remove_broadcast_recipients IS 
  'Removes recipients from a broadcast conversation. Only the creator can remove recipients.';

-- ============================================================================
-- Drop old broadcast_groups table and functions if they exist
-- ============================================================================

DROP TABLE IF EXISTS broadcast_groups CASCADE;
DROP FUNCTION IF EXISTS send_broadcast_message CASCADE;
