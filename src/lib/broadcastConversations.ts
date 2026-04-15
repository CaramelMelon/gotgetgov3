/**
 * Broadcast Conversations - WhatsApp-style broadcast lists
 * 
 * A broadcast conversation appears in your chat list like a group.
 * When you send messages:
 * - Each recipient receives it as an individual DM from you
 * - Recipients can reply privately (goes to their DM with you)
 * - Recipients don't see each other or know they're in a broadcast
 * - You see your message history in the broadcast conversation
 * 
 * This matches WhatsApp's broadcast list behavior.
 */

import { supabase } from './supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BroadcastConversation {
  id: string;
  name: string;
  avatarUrl?: string;
  createdBy: string;
  recipientIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Create Broadcast Conversation ─────────────────────────────────────────

export interface CreateBroadcastParams {
  name: string;
  recipientIds: string[];
  avatarUrl?: string;
}

/**
 * Create a new broadcast conversation.
 * It will appear in your conversation list like a group.
 * 
 * @param params - Broadcast creation parameters
 * @returns The created broadcast conversation or error
 */
export async function createBroadcastConversation(
  params: CreateBroadcastParams
): Promise<{ conversation: BroadcastConversation | null; error?: string }> {
  const { name, recipientIds, avatarUrl } = params;

  // Validation
  if (!name?.trim()) {
    return { conversation: null, error: 'Broadcast name is required' };
  }

  if (!recipientIds || recipientIds.length === 0) {
    return { conversation: null, error: 'At least one recipient is required' };
  }

  if (recipientIds.length > 500) {
    return { conversation: null, error: 'Maximum 500 recipients allowed' };
  }

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      return { conversation: null, error: 'Not authenticated' };
    }

    const { data, error } = await supabase.rpc('create_broadcast_conversation', {
      p_name: name.trim(),
      p_creator_id: user.user.id,
      p_recipient_ids: recipientIds,
      p_avatar_url: avatarUrl || null,
    });

    if (error) {
      console.error('Failed to create broadcast conversation:', error);
      return { conversation: null, error: 'Failed to create broadcast conversation' };
    }

    // Fetch the created conversation
    const { data: conv, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError || !conv) {
      console.error('Failed to fetch created conversation:', fetchError);
      return { conversation: null, error: 'Failed to fetch created conversation' };
    }

    return {
      conversation: {
        id: conv.id,
        name: conv.name || 'Broadcast',
        avatarUrl: conv.avatar_url || undefined,
        createdBy: conv.created_by || user.user.id,
        recipientIds: conv.broadcast_recipient_ids || [],
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
      },
    };
  } catch (error) {
    console.error('Unexpected error creating broadcast conversation:', error);
    return { conversation: null, error: 'Unexpected error occurred' };
  }
}

// ─── Get Broadcast Conversations ───────────────────────────────────────────

/**
 * Get all broadcast conversations for the current user.
 * These appear in your conversation list.
 * 
 * @returns Array of broadcast conversations
 */
export async function getBroadcastConversations(): Promise<{
  conversations: BroadcastConversation[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('type', 'broadcast')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch broadcast conversations:', error);
      // Check if it's a column not found error
      if (error.message?.includes('broadcast_recipient_ids') || error.code === '42703') {
        return { 
          conversations: [], 
          error: 'Broadcast feature not set up. Please run the database migration.' 
        };
      }
      return { conversations: [], error: 'Failed to fetch broadcast conversations' };
    }

    const conversations: BroadcastConversation[] = (data || []).map((conv) => ({
      id: conv.id,
      name: conv.name || 'Broadcast',
      avatarUrl: conv.avatar_url || undefined,
      createdBy: conv.created_by || '',
      recipientIds: conv.broadcast_recipient_ids || [],
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    }));

    return { conversations };
  } catch (error) {
    console.error('Unexpected error fetching broadcast conversations:', error);
    return { 
      conversations: [], 
      error: 'Broadcast feature not available. Please apply the database migration.' 
    };
  }
}

/**
 * Get a specific broadcast conversation by ID.
 * 
 * @param conversationId - The broadcast conversation ID
 * @returns The broadcast conversation or null
 */
export async function getBroadcastConversation(
  conversationId: string
): Promise<{ conversation: BroadcastConversation | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('type', 'broadcast')
      .single();

    if (error) {
      console.error('Failed to fetch broadcast conversation:', error);
      return { conversation: null, error: 'Failed to fetch broadcast conversation' };
    }

    if (!data) {
      return { conversation: null, error: 'Broadcast conversation not found' };
    }

    return {
      conversation: {
        id: data.id,
        name: data.name || 'Broadcast',
        avatarUrl: data.avatar_url || undefined,
        createdBy: data.created_by || '',
        recipientIds: data.broadcast_recipient_ids || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (error) {
    console.error('Unexpected error fetching broadcast conversation:', error);
    return { conversation: null, error: 'Unexpected error occurred' };
  }
}

// ─── Send Message (Use existing messaging functions) ───────────────────────

/**
 * To send a message to a broadcast conversation, use the regular sendMessage function.
 * The message will automatically be broadcast to all recipients as individual DMs.
 * 
 * Example:
 * ```typescript
 * import { sendMessage } from '@/lib/messaging';
 * 
 * await sendMessage({
 *   conversationId: broadcastConversationId,
 *   content: 'Hello everyone!',
 * });
 * ```
 * 
 * The trigger will automatically:
 * 1. Store the message in the broadcast conversation (for your history)
 * 2. Send it as individual DMs to each recipient
 */

// ─── Manage Recipients ──────────────────────────────────────────────────────

/**
 * Update the complete recipient list for a broadcast conversation.
 * 
 * @param conversationId - The broadcast conversation ID
 * @param recipientIds - New complete list of recipient IDs
 * @returns Success status
 */
export async function updateBroadcastRecipients(
  conversationId: string,
  recipientIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!recipientIds || recipientIds.length === 0) {
    return { success: false, error: 'At least one recipient is required' };
  }

  if (recipientIds.length > 500) {
    return { success: false, error: 'Maximum 500 recipients allowed' };
  }

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase.rpc('update_broadcast_recipients', {
      p_conversation_id: conversationId,
      p_creator_id: user.user.id,
      p_recipient_ids: recipientIds,
    });

    if (error) {
      console.error('Failed to update recipients:', error);
      return { success: false, error: 'Failed to update recipients' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating recipients:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Add recipients to a broadcast conversation.
 * 
 * @param conversationId - The broadcast conversation ID
 * @param recipientIds - Array of user IDs to add
 * @returns Success status
 */
export async function addBroadcastRecipients(
  conversationId: string,
  recipientIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!recipientIds || recipientIds.length === 0) {
    return { success: false, error: 'No recipients provided' };
  }

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase.rpc('add_broadcast_recipients', {
      p_conversation_id: conversationId,
      p_creator_id: user.user.id,
      p_new_recipient_ids: recipientIds,
    });

    if (error) {
      console.error('Failed to add recipients:', error);
      return { success: false, error: 'Failed to add recipients' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error adding recipients:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Remove recipients from a broadcast conversation.
 * 
 * @param conversationId - The broadcast conversation ID
 * @param recipientIds - Array of user IDs to remove
 * @returns Success status
 */
export async function removeBroadcastRecipients(
  conversationId: string,
  recipientIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!recipientIds || recipientIds.length === 0) {
    return { success: false, error: 'No recipients provided' };
  }

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase.rpc('remove_broadcast_recipients', {
      p_conversation_id: conversationId,
      p_creator_id: user.user.id,
      p_remove_recipient_ids: recipientIds,
    });

    if (error) {
      console.error('Failed to remove recipients:', error);
      return { success: false, error: 'Failed to remove recipients' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error removing recipients:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

// ─── Update Broadcast Details ───────────────────────────────────────────────

export interface UpdateBroadcastParams {
  conversationId: string;
  name?: string;
  avatarUrl?: string;
}

/**
 * Update broadcast conversation details (name, avatar).
 * 
 * @param params - Update parameters
 * @returns Success status
 */
export async function updateBroadcastConversation(
  params: UpdateBroadcastParams
): Promise<{ success: boolean; error?: string }> {
  const { conversationId, name, avatarUrl } = params;

  if (!name && avatarUrl === undefined) {
    return { success: false, error: 'No updates provided' };
  }

  try {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name) updates.name = name.trim();
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl || null;

    const { error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .eq('type', 'broadcast');

    if (error) {
      console.error('Failed to update broadcast conversation:', error);
      return { success: false, error: 'Failed to update broadcast conversation' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating broadcast conversation:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

// ─── Delete Broadcast Conversation ──────────────────────────────────────────

/**
 * Delete a broadcast conversation.
 * Note: This does not delete the individual DM conversations that were created.
 * 
 * @param conversationId - The broadcast conversation ID
 * @returns Success status
 */
export async function deleteBroadcastConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('type', 'broadcast');

    if (error) {
      console.error('Failed to delete broadcast conversation:', error);
      return { success: false, error: 'Failed to delete broadcast conversation' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting broadcast conversation:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}
