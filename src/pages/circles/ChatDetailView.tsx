import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Avatar,
  IconArrowLeft,
} from '../../design-system';
import { ChatBubble } from '../../components/circles/ChatBubble';
import { MessageComposer } from '../../components/circles/MessageComposer';
import { ScheduleOverlapBar } from '../../components/circles/ScheduleOverlapBar';
import { SuggestTimeSheet } from '../../components/circles/SuggestTimeSheet';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestTutorial } from '../../contexts/GuestTutorialContext';
import { EMMA_CONV_ID } from '../../data/emmaDemoProfile';
import { IS_MOCK, useMockMode } from '../../contexts/MockModeContext';
import { MOCK_MESSAGES, MOCK_AUTH_PROFILE } from '../../data/mockDemoData';
import type { ConversationItem, MessageWithSender, MatchProposalPayload, AttachmentPayload } from '../../types/circles';
import { MATCH_PROPOSAL_PREFIX, ATTACHMENT_PREFIX } from '../../types/circles';
import { uploadAttachment } from '../../lib/attachments';
import type { PendingAttachment } from '../../components/circles/MessageComposer';
import { supabase } from '../../lib/supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isOnlineNow(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return '';
  const diffMin = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60_000);
  if (diffMin < 1) return 'Active now';
  if (diffMin < 60) return `Active ${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Active ${diffH}h ago`;
  return `Active ${Math.floor(diffH / 24)}d ago`;
}

/** Format a date for the day-separator chip */
function formatDaySeparator(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) {
    return `Today, ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  }
  if (sameDay(date, yesterday)) {
    return `Yesterday, ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  }
  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/** Returns true if two ISO timestamps belong to different calendar days */
function isDifferentDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() !== db.getFullYear() ||
    da.getMonth() !== db.getMonth() ||
    da.getDate() !== db.getDate()
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatDetailViewProps {
  conversationItem: ConversationItem;
  onBack: () => void;
  markAsRead: (conversationId: string) => Promise<void>;
  hideBackButton?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatDetailView({ conversationItem, onBack, markAsRead, hideBackButton = false }: ChatDetailViewProps) {
  const isDemo = conversationItem.conversation.id === EMMA_CONV_ID;
  const isMockConv = IS_MOCK && conversationItem.conversation.id.startsWith('conv-');
  const { tutorialStep, tutorialMessages, addUserMessage, advanceTutorial } = useGuestTutorial();
  const navigate = useNavigate();

  // For demo/mock chat: pass null to skip Supabase calls
  const {
    messages: realMessages,
    loading,
    error,
    sendMessage: realSendMessage,
    sending: realSending,
  } = useMessages(isDemo || isMockConv ? null : conversationItem.conversation.id);

  const rawMockMsgs = isMockConv ? (MOCK_MESSAGES[conversationItem.conversation.id] ?? []) : [];
  const [mockMsgs, setMockMsgs] = useState<typeof rawMockMsgs>(rawMockMsgs);

  const mockMessagesWithSender: MessageWithSender[] = mockMsgs.map(m => ({
    message: m,
    sender: m.sender_id === 'mock-me'
      ? MOCK_AUTH_PROFILE
      : conversationItem.otherParticipants.find(p => p.profile.id === m.sender_id)?.profile
        ?? conversationItem.otherParticipants[0]?.profile
        ?? MOCK_AUTH_PROFILE,
    isMine: m.sender_id === 'mock-me',
  }));

  const messages = isDemo ? tutorialMessages : isMockConv ? mockMessagesWithSender : realMessages;
  const sending = isDemo || isMockConv ? false : realSending;

  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const otherProfile = conversationItem.otherParticipants[0]?.profile ?? null;
  const otherUserId = otherProfile?.id ?? '';

  // Live last_seen — starts from the fetched profile, updated via realtime
  const [otherLastSeen, setOtherLastSeen] = useState<string | null>(otherProfile?.last_seen ?? null);

  useEffect(() => {
    setOtherLastSeen(otherProfile?.last_seen ?? null);
  }, [otherProfile?.last_seen]);

  useEffect(() => {
    if (isDemo || !otherUserId) return;
    const channel = supabase
      .channel(`profile-status-${otherUserId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${otherUserId}` },
        (payload) => {
          const updated = payload.new as { last_seen?: string | null };
          if (updated.last_seen !== undefined) setOtherLastSeen(updated.last_seen ?? null);
        }
      )
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [otherUserId, isDemo]);

  // Re-compute online status every minute so the label stays accurate
  const [, forceRender] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceRender(n => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const online = (isDemo || isMockConv) ? true : isOnlineNow(otherLastSeen);

  // Mark messages as read when entering the chat
  useEffect(() => {
    if (!isDemo) markAsRead(conversationItem.conversation.id);
  }, [conversationItem.conversation.id, markAsRead, isDemo]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Also mark as read when new messages arrive (skip for demo/mock)
  useEffect(() => {
    if (!isDemo && !isMockConv && messages.length > 0) {
      markAsRead(conversationItem.conversation.id);
    }
  }, [messages.length, conversationItem.conversation.id, markAsRead, isDemo, isMockConv]);

  // ── Send (real, demo, or mock) ───────────────────────────────────────────
  async function sendMessage(content: string, attachment?: PendingAttachment) {
    setUploadError(null);

    if (isMockConv) {
      if (!content.trim()) return;
      const newMsg = {
        id: `mock-sent-${Date.now()}`,
        conversation_id: conversationItem.conversation.id,
        sender_id: 'mock-me',
        content: content.trim(),
        encrypted_content: null,
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        created_at: new Date().toISOString(),
      };
      setMockMsgs(prev => [...prev, newMsg]);
      return;
    }

    if (isDemo) {
      if (attachment) {
        const payload: AttachmentPayload = {
          type: attachment.type,
          url: attachment.previewUrl,  // blob URL is fine for the demo session
          name: attachment.file.name,
          size: attachment.file.size,
          mimeType: attachment.file.type,
          caption: content.trim() || undefined,
        };
        addUserMessage(ATTACHMENT_PREFIX + JSON.stringify(payload));
      } else {
        addUserMessage(content);
      }
      if (tutorialStep === 'send_message') {
        advanceTutorial('emma_accepts');
      }
      return;
    }

    if (attachment) {
      const { url, error: uploadErr } = await uploadAttachment(
        attachment.file,
        conversationItem.conversation.id,
      );
      if (!url) {
        if (uploadErr === 'storage_not_configured') {
          // Storage bucket not set up yet — silent fallback to plain text
          await realSendMessage(`[Attachment: ${attachment.file.name}]`);
        } else {
          setUploadError(`Upload failed: ${uploadErr ?? 'Unknown error'}`);
        }
        return;
      }
      const payload: AttachmentPayload = {
        type: attachment.type,
        url,
        name: attachment.file.name,
        size: attachment.file.size,
        mimeType: attachment.file.type,
        caption: content.trim() || undefined,
      };
      await realSendMessage(ATTACHMENT_PREFIX + JSON.stringify(payload));
    } else {
      await realSendMessage(content);
    }
  }

  // ── Proposal handlers ────────────────────────────────────────────────────
  async function handleSendProposal(payload: Omit<MatchProposalPayload, 'status' | 'proposedBy'>) {
    if (!user) return;

    let challengeId: string | undefined;

    // Create DB challenge so it appears in the CHALLENGES section
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .insert({
        proposed_by: user.id,
        sport: (payload.sport as any) ?? 'tennis',
        format: 'singles',
        proposed_times: payload.datetime ? { 0: payload.datetime } : null,
        status: 'proposed',
        is_open: payload.visibility === 'open',
        location: payload.location ?? null,
      })
      .select('id')
      .single();

    if (!challengeError && challenge) {
      challengeId = challenge.id;
      // Proposer is accepted, recipient is pending
      await supabase.from('challenge_players').insert([
        { challenge_id: challengeId, user_id: user.id, team_number: 1, response: 'accepted' },
        { challenge_id: challengeId, user_id: otherUserId, team_number: 2, response: 'pending' },
      ]);
    } else {
      console.error('Failed to create challenge record:', challengeError);
    }

    const full: MatchProposalPayload = {
      ...payload,
      status: 'pending',
      proposedBy: user.id,
      ...(challengeId && { challengeId }),
    };
    sendMessage(MATCH_PROPOSAL_PREFIX + JSON.stringify(full));
  }

  async function handleAcceptProposal(messageId: string) {
    sendMessage('Accepted the match proposal!');

    if (!user || !messageId) return;

    const msg = messages.find(m => m.message.id === messageId);
    if (!msg?.message.content.startsWith(MATCH_PROPOSAL_PREFIX)) return;

    try {
      const payload: MatchProposalPayload = JSON.parse(
        msg.message.content.slice(MATCH_PROPOSAL_PREFIX.length)
      );
      if (!payload.challengeId) return;

      // Fetch proposed_times to use as confirmed_time
      const { data: challengeData } = await supabase
        .from('challenges')
        .select('proposed_times')
        .eq('id', payload.challengeId)
        .single();

      // Extract first time from proposed_times object
      const firstProposedTime = challengeData?.proposed_times 
        ? (Object.values(challengeData.proposed_times)[0] as string)
        : null;

      await supabase
        .from('challenges')
        .update({
          status: 'accepted',
          confirmed_time: firstProposedTime,
        })
        .eq('id', payload.challengeId);

      await supabase
        .from('challenge_players')
        .update({ response: 'accepted' })
        .eq('challenge_id', payload.challengeId)
        .eq('user_id', user.id);
    } catch (e) {
      console.error('Failed to update challenge on accept:', e);
    }
  }

  function handleAltProposal(_messageId: string) {
    setSuggestOpen(true);
  }

  function handleDeclineProposal(_messageId: string) {
    sendMessage("Thanks, but that time doesn't work for me.");
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-bg)',
      }}
    >
      {/* ── Chat Header ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px 10px 12px',
          gap: 10,
          background: 'var(--color-surf)',
          flexShrink: 0,
          borderBottom: '1px solid var(--color-bdr)',
        }}
      >
        {/* Back button — hidden on desktop two-panel layout */}
        {!hideBackButton && (
          <button
            onClick={onBack}
            aria-label="Go back"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-t2)',
              flexShrink: 0,
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surf-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-t1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-t2)'; }}
          >
            <IconArrowLeft size={18} />
          </button>
        )}

        {/* Avatar + name + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              name={conversationItem.displayName}
              imageUrl={conversationItem.displayAvatarUrl ?? undefined}
              size="md"
            />
            {online && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 1,
                  right: 1,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: 'var(--color-acc)',
                  border: '2px solid var(--color-surf)',
                }}
              />
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--color-t1)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
              }}
            >
              {conversationItem.displayName}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: online ? 'var(--color-acc)' : 'var(--color-t3)',
                fontWeight: online ? 600 : 400,
                margin: 0,
                letterSpacing: online ? '0.04em' : 0,
              }}
            >
              {online ? 'Active now' : formatLastSeen(otherLastSeen)}
            </p>
          </div>
        </div>

      </div>

      {/* ── Schedule Overlap Bar (real chats only) ───────────────────────── */}
      {!isDemo && user?.id && otherUserId && (
        <ScheduleOverlapBar
          myUserId={user.id}
          otherUserId={otherUserId}
          otherName={conversationItem.displayName}
        />
      )}

      {/* ── Message scroll area ──────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          WebkitOverflowScrolling: 'touch',
          background: 'var(--color-bg)',
        } as React.CSSProperties}
      >
        {loading && <LoadingSpinner />}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-red)',
              }}
            >
              {error}
            </p>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-t3)',
              }}
            >
              No messages yet. Say hello! 👋
            </p>
          </div>
        )}

        {renderMessages(messages, handleAcceptProposal, handleAltProposal, handleDeclineProposal)}
      </div>

      {/* ── Tutorial completion banner ────────────────────────────────────── */}
      {isDemo && tutorialStep === 'complete' && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          style={{
            margin: '12px 12px 4px',
            padding: '20px 16px',
            borderRadius: 18,
            background: 'rgba(22,212,106,0.10)',
            border: '1px solid var(--color-acc)',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎾</div>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700,
            color: 'var(--color-acc)', margin: '0 0 4px',
          }}>
            Tutorial Complete!
          </p>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 13,
            color: 'var(--color-t2)', margin: '0 0 16px', lineHeight: 1.45,
          }}>
            You know the basics. Ready to find real players?
          </p>
          <button
            onClick={() => navigate('/discover')}
            style={{
              background: 'var(--color-acc)', color: '#fff',
              border: 'none', borderRadius: 999,
              padding: '11px 28px', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
            }}
          >
            Start Exploring →
          </button>
        </motion.div>
      )}

      {/* ── Composer ─────────────────────────────────────────────────────── */}
      <MessageComposer
        onSend={sendMessage}
        sending={sending}
        sendError={isDemo ? null : (uploadError || error)}
        onSuggestTime={() => setSuggestOpen(true)}
      />

      {/* ── Suggest Time Sheet ───────────────────────────────────────────── */}
      <SuggestTimeSheet
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        onPropose={handleSendProposal}
        myUserId={user?.id ?? ''}
      />
    </div>
  );
}

// ─── Message list renderer with day separators ────────────────────────────────

function renderMessages(
  messages: MessageWithSender[],
  onAcceptProposal: (id: string) => void,
  onAltProposal: (id: string) => void,
  onDeclineProposal: (id: string) => void,
) {
  const nodes: React.ReactNode[] = [];

  messages.forEach((msg, i) => {
    const prev = messages[i - 1];

    // Insert a day separator when the date changes
    if (!prev || isDifferentDay(prev.message.created_at, msg.message.created_at)) {
      nodes.push(
        <DateSeparator key={`sep-${msg.message.id}`} date={msg.message.created_at} />
      );
    }

    // Show avatar only for first message in a consecutive group from same sender
    const prevIsSame =
      prev &&
      !prev.isMine &&
      !msg.isMine &&
      prev.message.sender_id === msg.message.sender_id;
    const showAvatar = !msg.isMine && !prevIsSame;

    nodes.push(
      <ChatBubble
        key={msg.message.id}
        msg={msg}
        showAvatar={showAvatar}
        onAcceptProposal={onAcceptProposal}
        onAltProposal={onAltProposal}
        onDeclineProposal={onDeclineProposal}
      />
    );
  });

  return nodes;
}

// ─── Day separator ────────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        margin: '16px 4px 10px',
      }}
    >
      <div style={{ flex: 1, height: 1, background: 'var(--color-bdr)' }} />
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: 'var(--color-t3)',
          flexShrink: 0,
        }}
      >
        {formatDaySeparator(date)}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--color-bdr)' }} />
    </div>
  );
}

// ─── Header icon button ───────────────────────────────────────────────────────

function HeaderIconButton({
  children,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  'aria-label'?: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      style={{
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-surf-2)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-t1)',
      }}
    >
      {children}
    </button>
  );
}

// ─── Loading spinner ──────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 'var(--radius-full)',
          border: '2.5px solid var(--color-bdr)',
          borderTopColor: 'var(--color-acc)',
          animation: 'spin 0.7s linear infinite',
        }}
      />
    </div>
  );
}
