# Broadcast Conversations - WhatsApp-Style Implementation

## Overview

Broadcast conversations work exactly like WhatsApp broadcast lists:
- Appears as a conversation in your chat list (like a group)
- Send messages repeatedly without hassle
- Each recipient receives messages as individual DMs
- Recipients can reply privately (only you see their replies)
- Recipients don't see other recipients or know they're in a broadcast

## Key Difference from Previous Approach

**OLD**: Separate broadcast groups table, had to call special function to send each time
**NEW**: Broadcast is a conversation type - just send messages normally and they auto-broadcast!

## How It Works

### 1. Create a Broadcast Conversation

```typescript
import { createBroadcastConversation } from '@/lib/broadcastConversations';

const { conversation } = await createBroadcastConversation({
  name: 'Tennis Club Updates',
  recipientIds: ['user1', 'user2', 'user3'],
  avatarUrl: 'https://example.com/avatar.jpg', // optional
});

// Now it appears in your conversation list!
```

### 2. Send Messages (Just Like a Normal Chat!)

```typescript
import { sendMessage } from '@/lib/messaging';

// Send a message - it automatically broadcasts to all recipients
await sendMessage({
  conversationId: conversation.id,
  content: 'Practice cancelled today!',
});

// Send another message later - no hassle!
await sendMessage({
  conversationId: conversation.id,
  content: 'Rescheduled for tomorrow at 5pm',
});
```

### 3. What Happens Behind the Scenes

When you send a message to a broadcast conversation:
1. Message is stored in the broadcast conversation (your history)
2. Database trigger automatically sends it as individual DMs to each recipient
3. Each recipient sees it in their DM with you
4. When they reply, it goes to their DM with you (not to other recipients)

## UI Integration

### In Your Conversation List

Broadcast conversations appear alongside your other chats:

```typescript
// Fetch all conversations (includes broadcasts)
const conversations = await getConversations();

// Filter broadcasts if needed
const broadcasts = conversations.filter(c => c.type === 'broadcast');

// Display with a broadcast icon
{conversation.type === 'broadcast' && (
  <BroadcastIcon className="text-green-500" />
)}
```

### Opening a Broadcast Conversation

It works exactly like opening any other conversation:

```typescript
// User clicks on broadcast conversation
<ConversationItem
  conversation={broadcastConversation}
  onClick={() => navigate(`/chat/${broadcastConversation.id}`)}
/>

// In ChatView, just use the regular messaging UI
<ChatView conversationId={broadcastConversation.id} />

// Messages sent here automatically broadcast to all recipients!
```

### Managing Recipients

```typescript
import {
  addBroadcastRecipients,
  removeBroadcastRecipients,
  getBroadcastConversation,
} from '@/lib/broadcastConversations';

// View current recipients
const { conversation } = await getBroadcastConversation(conversationId);
console.log('Recipients:', conversation.recipientIds);

// Add more recipients
await addBroadcastRecipients(conversationId, ['new-user-1', 'new-user-2']);

// Remove recipients
await removeBroadcastRecipients(conversationId, ['user-to-remove']);
```

## Complete Example: Broadcast UI Component

```typescript
import { useState, useEffect } from 'react';
import {
  createBroadcastConversation,
  getBroadcastConversations,
  type BroadcastConversation,
} from '@/lib/broadcastConversations';
import { sendMessage } from '@/lib/messaging';

export function BroadcastList() {
  const [broadcasts, setBroadcasts] = useState<BroadcastConversation[]>([]);
  const [selectedBroadcast, setSelectedBroadcast] = useState<string | null>(null);

  useEffect(() => {
    loadBroadcasts();
  }, []);

  async function loadBroadcasts() {
    const { conversations } = await getBroadcastConversations();
    setBroadcasts(conversations);
  }

  async function handleCreateBroadcast(name: string, recipientIds: string[]) {
    const { conversation, error } = await createBroadcastConversation({
      name,
      recipientIds,
    });

    if (error) {
      alert('Failed to create: ' + error);
    } else {
      setBroadcasts([conversation, ...broadcasts]);
      // Navigate to the new broadcast conversation
      setSelectedBroadcast(conversation.id);
    }
  }

  return (
    <div className="flex h-full">
      {/* Broadcast List */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Broadcast Lists</h2>
          <button
            onClick={() => {/* Show create modal */}}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
          >
            New Broadcast
          </button>
        </div>

        <div className="overflow-y-auto">
          {broadcasts.map((broadcast) => (
            <div
              key={broadcast.id}
              onClick={() => setSelectedBroadcast(broadcast.id)}
              className={`p-4 cursor-pointer hover:bg-gray-100 ${
                selectedBroadcast === broadcast.id ? 'bg-gray-200' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  📢
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{broadcast.name}</div>
                  <div className="text-sm text-gray-500">
                    {broadcast.recipientIds.length} recipients
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat View */}
      <div className="flex-1">
        {selectedBroadcast ? (
          <ChatView conversationId={selectedBroadcast} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a broadcast list to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
```

## Database Migration

Apply the migration to enable broadcast conversations:

```bash
supabase db push
```

The migration:
- Adds `broadcast_recipient_ids` column to conversations table
- Creates trigger to auto-broadcast messages to recipients
- Adds functions for managing broadcast conversations

## API Reference

### Create Broadcast

```typescript
createBroadcastConversation({
  name: string;
  recipientIds: string[];
  avatarUrl?: string;
})
```

### Get Broadcasts

```typescript
getBroadcastConversations() // Get all
getBroadcastConversation(id) // Get specific one
```

### Send Message

```typescript
// Use regular sendMessage function!
sendMessage({
  conversationId: broadcastId,
  content: 'Your message',
})
```

### Manage Recipients

```typescript
addBroadcastRecipients(conversationId, recipientIds)
removeBroadcastRecipients(conversationId, recipientIds)
updateBroadcastRecipients(conversationId, recipientIds) // Replace all
```

### Update Details

```typescript
updateBroadcastConversation({
  conversationId,
  name?: string,
  avatarUrl?: string,
})
```

### Delete

```typescript
deleteBroadcastConversation(conversationId)
```

## Recipient Experience

When you send a broadcast message:

**You see:**
```
[Broadcast: Tennis Club Updates]
You: Practice cancelled today!
You: Rescheduled for tomorrow at 5pm
```

**Recipient 1 sees:**
```
[DM with You]
You: Practice cancelled today!
You: Rescheduled for tomorrow at 5pm
Recipient 1: Thanks for letting me know!
```

**Recipient 2 sees:**
```
[DM with You]
You: Practice cancelled today!
You: Rescheduled for tomorrow at 5pm
Recipient 2: See you tomorrow!
```

Recipients don't see each other's replies - each has their own private conversation with you.

## Benefits Over Previous Approach

✅ **No hassle sending multiple messages** - Just chat normally
✅ **Message history in one place** - See all your broadcasts in the conversation
✅ **Familiar UI** - Works like any other conversation
✅ **Automatic broadcasting** - Database trigger handles everything
✅ **Cleaner code** - No special send function needed

## Files Created/Modified

### Created:
- `supabase/migrations/20260416000000_056_broadcast_groups.sql` - Database schema & triggers
- `src/lib/broadcastConversations.ts` - TypeScript API
- `BROADCAST_CONVERSATIONS_GUIDE.md` - This guide

### Modified:
- `src/types/database.ts` - Added broadcast conversation types

### Deleted:
- `src/lib/broadcastGroups.ts` - Replaced with broadcastConversations.ts
