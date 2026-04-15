import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, UserRound, Users, Megaphone, Plus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, IconSearch, IconPencil } from '../../design-system';
import { StoriesStrip } from '../../components/circles/StoriesStrip';
import { ConversationRow } from '../../components/circles/ConversationRow';
import { ComposeMenu } from '../../components/messaging/ComposeMenu';
import { CreateGroupModal } from '../../components/messaging/CreateGroupModal';
import { CreateBroadcastModal } from '../../components/messaging/CreateBroadcastModal';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestTutorial } from '../../contexts/GuestTutorialContext';
import { supabase } from '../../lib/supabase';
import { searchUserById, determineSearchType, formatUserIdForDisplay } from '../../lib/userId';
import { 
  getBroadcastConversations, 
  createBroadcastConversation,
  type BroadcastConversation 
} from '../../lib/broadcastConversations';
import { EMMA_CONVERSATION_ITEM, EMMA_CONV_ID } from '../../data/emmaDemoProfile';
import type { ConversationItem } from '../../types/circles';
import type { Profile } from '../../types/database';

type CirclesTab = 'dms' | 'groups' | 'broadcast';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CirclesListViewProps {
  conversations: ConversationItem[];
  loading: boolean;
  error: string | null;
  onOpenChat: (item: ConversationItem) => void;
  onNewChat: (contactId: string, contactProfile: Profile) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
  selectedConversationId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CirclesListView({ conversations, loading, error, onOpenChat, onNewChat, scrollContainerRef, hasMore, loadMore, loadingMore, selectedConversationId }: CirclesListViewProps) {
  const { profile, isGuest } = useAuth();
  const { tutorialStep } = useGuestTutorial();
  const [activeTab, setActiveTab] = useState<CirclesTab>('dms');
  const [searchQuery, setSearchQuery] = useState('');
  const [showComposeMenu, setShowComposeMenu] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateBroadcast, setShowCreateBroadcast] = useState(false);
  const [allContacts, setAllContacts] = useState<Profile[]>([]);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // ── ID-based search state ────────────────────────────────────────────────
  const [idResult, setIdResult] = useState<Profile | null>(null);
  const [idSearching, setIdSearching] = useState(false);
  const [idNotFound, setIdNotFound] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = searchQuery.trim();
    const isId = determineSearchType(q) === 'id';

    // Reset previous ID result whenever query changes
    setIdResult(null);
    setIdNotFound(false);

    if (!isId || q.length < 3) {
      setIdSearching(false);
      return;
    }

    // Debounce: wait 500 ms after user stops typing
    setIdSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const found = await searchUserById(q);
      setIdSearching(false);
      if (found) {
        setIdResult(found);
        setIdNotFound(false);
      } else {
        setIdNotFound(true);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Load all accepted connections once on mount so search is instant
  useEffect(() => {
    if (!profile) return;
    supabase
      .from('connections')
      .select('connected_user_id, profiles!connections_connected_user_id_fkey(id, full_name, avatar_url, last_seen)')
      .eq('user_id', profile.id)
      .eq('status', 'accepted')
      .then(({ data }) => {
        const profiles = (data ?? []).map((row: any) => row.profiles as Profile).filter(Boolean);
        setAllContacts(profiles);
      });
  }, [profile]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!loadMoreTriggerRef.current || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loadMoreTriggerRef.current);

    return () => observer.disconnect();
  }, [hasMore, loadMore, loadingMore, loading]);

  const q = searchQuery.trim().toLowerCase();
  const isIdSearch = searchQuery.trim().startsWith('#');

  // Tutorial: inject Emma DM when in relevant tutorial steps
  const EMMA_TUTORIAL_STEPS = ['go_to_messages', 'emma_greeting', 'send_message', 'emma_accepts', 'complete'];
  const showEmmaDM = isGuest && EMMA_TUTORIAL_STEPS.includes(tutorialStep);

  // Tab-based conversation split
  const dmConvosBase = conversations.filter((c) => c.conversation.type === 'direct' && c.conversation.id !== EMMA_CONV_ID);
  const dmConvos    = showEmmaDM ? [EMMA_CONVERSATION_ITEM, ...dmConvosBase] : dmConvosBase;
  const groupConvos = conversations.filter((c) => c.conversation.type !== 'direct');
  const tabConvos   = activeTab === 'dms' ? dmConvos : activeTab === 'groups' ? groupConvos : [];

  const filtered = q && !isIdSearch
    ? tabConvos.filter((c) =>
        c.displayName.toLowerCase().includes(q) ||
        (c.lastMessage?.content ?? '').toLowerCase().includes(q)
      )
    : isIdSearch
    ? []   // hide conversations during ID-mode; show ID result card instead
    : tabConvos;

  // Contacts that match the search but don't yet have a direct conversation (DMs tab only)
  const existingDmIds = new Set(
    dmConvos
      .map((c) => c.otherParticipants[0]?.profile?.id)
      .filter(Boolean)
  );
  const contactSuggestions = q && !isIdSearch && activeTab === 'dms'
    ? allContacts.filter(
        (p) =>
          (p.full_name ?? '').toLowerCase().includes(q) &&
          !existingDmIds.has(p.id)
      )
    : [];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-bg)',
        // Panel-level background keeps list visually distinct from chat area
      }}
    >
      {/* ── Search bar & New Chat ──────────────────────────────────────── */}
      <div style={{ padding: '14px 12px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search bar */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: 'var(--color-surf)',
              borderRadius: 9,
              padding: '8px 11px',
              border: searchFocused || searchQuery
                ? '1px solid var(--color-acc)'
                : '1px solid var(--color-bdr)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxShadow: searchFocused
                ? '0 0 0 3px var(--color-acc-bg)'
                : 'none',
            }}
          >
            <IconSearch size={13} style={{ color: searchFocused ? 'var(--color-acc)' : 'var(--color-t3)', flexShrink: 0, transition: 'color 0.15s' }} />
            <input
              type="text"
              placeholder="Search circles…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--color-t1)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--color-t3)', lineHeight: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* New Chat button */}
          <button
            aria-label="New message"
            onClick={() => setShowComposeMenu(true)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--color-acc-bg)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-acc)',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--color-acc) 22%, transparent)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-acc-bg)'; }}
          >
            <IconPencil size={15} />
          </button>
        </div>
      </div>

      {/* ── Stories strip (always visible) ──────────────────────────────── */}
      {profile && (
        <div style={{ flexShrink: 0 }}>
          <StoriesStrip
            currentUser={profile as Profile}
            conversations={conversations}
          />
        </div>
      )}

      {/* ── Tab bar (below stories) ──────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        padding: '0 12px',
        borderBottom: '1px solid var(--color-bdr)',
      }}>
        {([
          { id: 'dms' as CirclesTab,       label: 'DMs',       icon: <MessageCircle size={12} /> },
          { id: 'groups' as CirclesTab,    label: 'Groups',    icon: <Users size={12} /> },
          { id: 'broadcast' as CirclesTab, label: 'Broadcast', icon: <Megaphone size={12} /> },
        ]).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '10px 12px 9px',
                border: 'none',
                borderBottom: active ? '2px solid var(--color-acc)' : '2px solid transparent',
                background: 'none',
                color: active ? 'var(--color-t1)' : 'var(--color-t3)',
                fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 400, fontSize: 12,
                cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
                flexShrink: 0, marginBottom: -1,
                letterSpacing: active ? '-0.01em' : '0',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-t2)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-t3)'; }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Section label ────────────────────────────────────────────────── */}
      {!loading && !isIdSearch && filtered.length > 0 && activeTab !== 'broadcast' && (
        <div style={{ padding: '10px 14px 4px', flexShrink: 0 }}>
          <SectionLabel label={activeTab === 'dms' ? 'Messages' : 'Groups'} />
        </div>
      )}

      {/* ── Conversation list ────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 8,
          paddingLeft: 4,
          paddingRight: 4,
          overscrollBehavior: 'contain',
        } as React.CSSProperties}
      >
        {/* ── Broadcast tab UI ─────────────────────────────────────────── */}
        {activeTab === 'broadcast' && !loading && (
          <BroadcastTab contacts={allContacts} onOpenChat={onOpenChat} />
        )}

        {activeTab !== 'broadcast' && loading && <SkeletonList />}

        {activeTab !== 'broadcast' && !loading && error && (
          <ErrorBanner message={error} />
        )}

        {/* ── ID search result ─────────────────────────────────────────── */}
        {isIdSearch && (
          <>
            {idSearching && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <div style={{ width: 22, height: 22, border: '2.5px solid var(--color-bdr)', borderTopColor: 'var(--color-acc)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              </div>
            )}

            {!idSearching && idResult && (
              <div style={{ margin: '12px 16px', borderRadius: 16, background: 'var(--color-surf-2)', border: '1px solid var(--color-bdr)', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar name={idResult.full_name ?? '?'} imageUrl={idResult.avatar_url ?? undefined} size="lg" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--color-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {idResult.full_name ?? 'Unknown'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-acc)', fontWeight: 600 }}>
                      {formatUserIdForDisplay(idResult.id).toUpperCase()}
                    </p>
                    {idResult.location_city && (
                      <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)' }}>
                        📍 {idResult.location_city}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button
                    onClick={() => onNewChat(idResult.id, idResult)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'var(--color-acc)', color: '#fff',
                      fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
                    }}
                  >
                    <MessageCircle size={15} />
                    Message
                  </button>
                  <button
                    onClick={() => {/* view profile */}}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px 0', borderRadius: 10, cursor: 'pointer',
                      background: 'var(--color-surf)', border: '1px solid var(--color-bdr)',
                      fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-t1)',
                    }}
                  >
                    <UserRound size={15} />
                    View Profile
                  </button>
                </div>
              </div>
            )}

            {!idSearching && idNotFound && searchQuery.trim().length >= 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 32px', gap: 8 }}>
                <span style={{ fontSize: 36 }}>🔍</span>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', textAlign: 'center', margin: 0 }}>
                  No player found with that ID.
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', textAlign: 'center', margin: 0 }}>
                  IDs look like <strong style={{ color: 'var(--color-acc)' }}>#a3f5b2c1</strong>
                </p>
              </div>
            )}
          </>
        )}

        {!loading && !error && !isIdSearch && activeTab !== 'broadcast' && filtered.length === 0 && contactSuggestions.length === 0 && (
          <EmptyState hasSearch={searchQuery.trim().length > 0} tab={activeTab} />
        )}

        {!loading &&
          !error &&
          filtered.map((item) => (
            <ConversationRow
              key={item.conversation.id}
              item={item}
              onClick={onOpenChat}
              isSelected={selectedConversationId === item.conversation.id}
            />
          ))}

        {/* ── Contact suggestions (search results for new circles) ───────── */}
        {!loading && contactSuggestions.length > 0 && (
          <>
            <div style={{ padding: '8px 16px 2px' }}>
              <SectionLabel label="Start a new circle" />
            </div>
            {contactSuggestions.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onNewChat(contact.id, contact)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <Avatar name={contact.full_name ?? '?'} imageUrl={contact.avatar_url ?? undefined} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--color-t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contact.full_name ?? 'Unknown'}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-acc)', margin: 0, fontWeight: 600 }}>
                    Start conversation
                  </p>
                </div>
              </button>
            ))}
          </>
        )}

        {/* ── Lazy loading trigger and indicator ───────────────────────── */}
        {!loading && !error && !isIdSearch && activeTab !== 'broadcast' && hasMore && (
          <div ref={loadMoreTriggerRef} style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
            {loadingMore && (
              <div style={{ width: 20, height: 20, border: '2.5px solid var(--color-bdr)', borderTopColor: 'var(--color-acc)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            )}
          </div>
        )}
      </div>

      {/* ── New Chat Sheet ──────────────────────────────────────────────── */}
      {profile && (
        <NewChatSheet
          open={newChatOpen}
          myUserId={profile.id}
          existingConversations={conversations}
          onClose={() => setNewChatOpen(false)}
          onSelect={(contactId, contactProfile) => {
            setNewChatOpen(false);
            onNewChat(contactId, contactProfile);
          }}
        />
      )}

      {/* ── Compose Menu ──────────────────────────────────────────────── */}
      <ComposeMenu
        open={showComposeMenu}
        onClose={() => setShowComposeMenu(false)}
        onNewChat={() => {
          setNewChatOpen(true);
          setActiveTab('dms');
        }}
        onNewGroup={() => {
          setShowCreateGroup(true);
          setActiveTab('groups');
        }}
        onNewBroadcast={() => {
          setShowCreateBroadcast(true);
          setActiveTab('broadcast');
        }}
      />

      {/* ── Create Group Modal ──────────────────────────────────────────────── */}
      {profile && (
        <CreateGroupModal
          open={showCreateGroup}
          onOpenChange={setShowCreateGroup}
          onGroupCreated={(conversationId) => {
            // Handle group created - could navigate to it or refresh list
            console.log('Group created:', conversationId);
          }}
        />
      )}

      {/* ── Create Broadcast Modal ──────────────────────────────────────────────── */}
      {profile && (
        <CreateBroadcastModal
          open={showCreateBroadcast}
          onOpenChange={setShowCreateBroadcast}
          userId={profile.id}
          onChannelCreated={(conversationId) => {
            // Handle broadcast created - could navigate to it or refresh list
            console.log('Broadcast created:', conversationId);
          }}
        />
      )}
    </div>
  );
}

// ─── New Chat Sheet ───────────────────────────────────────────────────────────

interface NewChatSheetProps {
  open: boolean;
  myUserId: string;
  existingConversations: ConversationItem[];
  onClose: () => void;
  onSelect: (contactId: string, contactProfile: Profile) => void;
}

function NewChatSheet({ open, myUserId, existingConversations, onClose, onSelect }: NewChatSheetProps) {
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoadingContacts(true);
    supabase
      .from('connections')
      .select('connected_user_id, profiles!connections_connected_user_id_fkey(id, full_name, avatar_url, last_seen)')
      .eq('user_id', myUserId)
      .eq('status', 'accepted')
      .then(({ data }) => {
        const profiles = (data ?? [])
          .map((row: any) => row.profiles as Profile)
          .filter(Boolean);
        setContacts(profiles);
        setLoadingContacts(false);
      });
  }, [open, myUserId]);

  const filtered = contactSearch.trim()
    ? contacts.filter((p) =>
        (p.full_name ?? '').toLowerCase().includes(contactSearch.toLowerCase())
      )
    : contacts;

  // Mark contacts who already have a conversation (to show "existing" hint)
  const existingIds = new Set(
    existingConversations
      .filter((c) => c.conversation.type === 'direct')
      .map((c) => c.otherParticipants[0]?.profile?.id)
      .filter(Boolean)
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1200 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1201,
              background: 'var(--color-surf)',
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
              maxHeight: '80dvh',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Handle + header */}
            <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr)', margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-t1)', margin: 0 }}>
                  New Message
                </h2>
                <button
                  onClick={onClose}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--color-bdr)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-t2)' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surf-2)', borderRadius: 'var(--radius-full)', padding: '9px 14px', marginBottom: 12 }}>
                <IconSearch size={14} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  autoFocus
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t1)' }}
                />
              </div>
            </div>

            {/* Contact list */}
            <div style={{ overflowY: 'auto', flex: 1 }} className="hide-scrollbar">
              {loadingContacts && (
                <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: 20, height: 20, border: '2.5px solid var(--color-bdr)', borderTopColor: 'var(--color-acc)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              )}

              {!loadingContacts && filtered.length === 0 && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t3)', textAlign: 'center', padding: '32px 16px', margin: 0 }}>
                  {contactSearch.trim() ? 'No contacts match your search.' : 'No connected contacts yet.'}
                </p>
              )}

              {!loadingContacts && filtered.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => onSelect(contact.id, contact)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Avatar name={contact.full_name ?? '?'} imageUrl={contact.avatar_url ?? undefined} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--color-t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {contact.full_name ?? 'Unknown'}
                    </p>
                    {existingIds.has(contact.id) && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', margin: 0 }}>
                        Existing conversation
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 9,
        color: 'var(--color-t3)',
        fontWeight: 700,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 0',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-surf-2)',
              flexShrink: 0,
              animation: 'shimmer 1.4s ease-in-out infinite',
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                height: 13,
                width: `${55 + i * 10}%`,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surf-2)',
                animation: 'shimmer 1.4s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: 11,
                width: `${40 + i * 8}%`,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surf-2)',
                animation: 'shimmer 1.4s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasSearch, tab }: { hasSearch: boolean; tab?: CirclesTab }) {
  const emoji = tab === 'groups' ? '👥' : '💬';
  const blankMsg = tab === 'groups'
    ? 'No group chats yet.\nCreate one with the ✏️ button above.'
    : 'No circles yet.\nConnect with players on Discover.';
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        gap: 10,
      }}
    >
      <span style={{ fontSize: 40 }}>{emoji}</span>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-t2)',
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.5,
          whiteSpace: 'pre-line',
        }}
      >
        {hasSearch ? 'No conversations match your search.' : blankMsg}
      </p>
    </div>
  );
}

// ─── Broadcast tab ────────────────────────────────────────────────────────────

function BroadcastTab({ contacts, onOpenChat }: { contacts: Profile[]; onOpenChat: (item: ConversationItem) => void }) {
  const [broadcasts, setBroadcasts] = useState<BroadcastConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadBroadcasts();
  }, []);

  async function loadBroadcasts() {
    setLoading(true);
    setError(null);
    try {
      const { conversations, error: fetchError } = await getBroadcastConversations();
      if (fetchError) {
        console.error('Failed to load broadcasts:', fetchError);
        setError('Failed to load broadcast lists. Please make sure the database migration has been applied.');
      } else {
        setBroadcasts(conversations);
      }
    } catch (err) {
      console.error('Unexpected error loading broadcasts:', err);
      setError('An unexpected error occurred. The broadcast feature may not be set up yet.');
    }
    setLoading(false);
  }

  async function handleBroadcastClick(broadcast: BroadcastConversation) {
    // Convert broadcast to ConversationItem format
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return;

    const conversationItem: ConversationItem = {
      conversation: {
        id: broadcast.id,
        type: 'broadcast',
        circle_id: null,
        team_id: null,
        name: broadcast.name,
        avatar_url: broadcast.avatarUrl || null,
        created_by: broadcast.createdBy,
        broadcast_recipient_ids: broadcast.recipientIds,
        created_at: broadcast.createdAt,
        updated_at: broadcast.updatedAt,
      },
      otherParticipants: [],
      myParticipant: {
        id: user.user.id,
        conversation_id: broadcast.id,
        user_id: user.user.id,
        last_read_at: null,
        joined_at: broadcast.createdAt,
        is_admin: true,
        is_creator: true,
      },
      lastMessage: null,
      unreadCount: 0,
      displayName: broadcast.name,
      displayAvatarUrl: broadcast.avatarUrl || null,
      isOnline: false,
      lastActivity: broadcast.updatedAt,
    };
    onOpenChat(conversationItem);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
        <div style={{ width: 22, height: 22, border: '2.5px solid var(--color-bdr)', borderTopColor: 'var(--color-acc)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <div style={{
          padding: '16px',
          borderRadius: 12,
          background: 'var(--color-red-bg)',
          border: '1px solid var(--color-red)',
        }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-red)',
            margin: '0 0 8px',
          }}>
            Broadcast Feature Not Available
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-t2)',
            margin: '0 0 12px',
          }}>
            {error}
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-t3)',
            margin: 0,
          }}>
            Run: <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: 4 }}>supabase db push</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Create button */}
      <div style={{ padding: '12px 16px 8px' }}>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 0',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            background: 'var(--color-acc)',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 14,
            transition: 'all 0.15s',
          }}
        >
          <Plus size={16} />
          New Broadcast List
        </button>
      </div>

      {/* Broadcast list */}
      {broadcasts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 32px', gap: 12 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--color-acc-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Megaphone size={28} style={{ color: 'var(--color-acc)' }} />
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, color: 'var(--color-t1)', textAlign: 'center', margin: 0 }}>
            No Broadcast Lists Yet
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)', textAlign: 'center', margin: 0, maxWidth: 280 }}>
            Create a broadcast list to send messages to multiple contacts at once. They'll receive it as a personal message from you.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 4px' }}>
          {broadcasts.map((broadcast) => (
            <button
              key={broadcast.id}
              onClick={() => handleBroadcastClick(broadcast)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                textAlign: 'left',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surf-2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {/* Avatar */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--color-acc-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {broadcast.avatarUrl ? (
                  <img
                    src={broadcast.avatarUrl}
                    alt={broadcast.name}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <Megaphone size={22} style={{ color: 'var(--color-acc)' }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: 15,
                    color: 'var(--color-t1)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {broadcast.name}
                  </p>
                </div>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: 'var(--color-t3)',
                  margin: 0,
                }}>
                  {broadcast.recipientIds.length} recipient{broadcast.recipientIds.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Chevron */}
              <ChevronRight size={18} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}

      {/* Create broadcast modal */}
      {showCreateModal && (
        <BroadcastCreateModal
          contacts={contacts}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newBroadcast) => {
            setBroadcasts([newBroadcast, ...broadcasts]);
            setShowCreateModal(false);
            handleBroadcastClick(newBroadcast);
          }}
        />
      )}
    </>
  );
}

// ─── Broadcast Create Modal ───────────────────────────────────────────────────

interface BroadcastCreateModalProps {
  contacts: Profile[];
  onClose: () => void;
  onCreated: (broadcast: BroadcastConversation) => void;
}

function BroadcastCreateModal({ contacts, onClose, onCreated }: BroadcastCreateModalProps) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError('Please enter a broadcast list name');
      return;
    }
    if (selected.size === 0) {
      setError('Please select at least one recipient');
      return;
    }

    setCreating(true);
    setError('');

    const { conversation, error: createError } = await createBroadcastConversation({
      name: name.trim(),
      recipientIds: Array.from(selected),
    });

    if (createError) {
      setError(createError);
      setCreating(false);
    } else if (conversation) {
      onCreated(conversation);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg)',
          borderRadius: 20,
          maxWidth: 480,
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--color-bdr)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-body)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--color-t1)',
            margin: 0,
          }}>
            New Broadcast List
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              color: 'var(--color-t3)',
              lineHeight: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Name input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--color-t3)',
              marginBottom: 8,
            }}>
              Broadcast List Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tennis Club, Family, Work Team"
              autoFocus
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--color-surf-2)',
                border: '1px solid var(--color-bdr)',
                borderRadius: 12,
                padding: '10px 14px',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--color-t1)',
                outline: 'none',
              }}
            />
          </div>

          {/* Recipients */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--color-t3)',
              marginBottom: 8,
            }}>
              Select Recipients ({selected.size})
            </label>

            {contacts.length === 0 ? (
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--color-t3)',
                textAlign: 'center',
                padding: '16px 0',
                margin: 0,
              }}>
                No connected contacts yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {contacts.map((c) => {
                  const checked = selected.has(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggle(c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: 'none',
                        cursor: 'pointer',
                        background: checked ? 'var(--color-acc-bg)' : 'var(--color-surf-2)',
                        textAlign: 'left',
                        transition: 'background 0.12s',
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        flexShrink: 0,
                        border: checked ? 'none' : '1.5px solid var(--color-bdr)',
                        background: checked ? 'var(--color-acc)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {checked && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </div>
                      <Avatar name={c.full_name ?? '?'} imageUrl={c.avatar_url ?? undefined} size="sm" />
                      <p style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        fontSize: 14,
                        color: 'var(--color-t1)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {c.full_name ?? 'Unknown'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 12,
              background: 'var(--color-red-bg)',
            }}>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--color-red)',
                margin: 0,
              }}>
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--color-bdr)',
          display: 'flex',
          gap: 12,
        }}>
          <button
            onClick={onClose}
            disabled={creating}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              cursor: creating ? 'not-allowed' : 'pointer',
              background: 'var(--color-surf-2)',
              border: '1px solid var(--color-bdr)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--color-t1)',
              opacity: creating ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim() || selected.size === 0}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              cursor: (creating || !name.trim() || selected.size === 0) ? 'not-allowed' : 'pointer',
              background: (creating || !name.trim() || selected.size === 0) ? 'var(--color-surf-2)' : 'var(--color-acc)',
              color: (creating || !name.trim() || selected.size === 0) ? 'var(--color-t3)' : '#fff',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {creating ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Create
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        margin: '12px 16px',
        padding: '10px 14px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-red-bg)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-red)',
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  );
}
