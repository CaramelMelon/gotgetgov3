import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { CirclesSkeleton } from '../../components/skeletons';
import { CirclesListView } from './CirclesListView';
import { ChatDetailView } from './ChatDetailView';
import { MatchesView } from './MatchesView';
import { CirclesView } from './CirclesView';
import { useConversations } from '../../hooks/useConversations';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestTutorial } from '../../contexts/GuestTutorialContext';
import { useNavVisibility } from '../../contexts/NavVisibilityContext';
import { useResponsive } from '../../hooks/useResponsive';
import { getOrCreateDirectConversation } from '../../lib/messaging';
import { EMMA_CONVERSATION_ITEM } from '../../data/emmaDemoProfile';
import { SegmentedControl } from '../../components/circles';
import type { CirclesScreen, ConversationItem } from '../../types/circles';
import type { Profile } from '../../types/database';
import type { CirclesSegment } from '../../components/circles/SegmentedControl';
import type { FeedData } from '../../api/feed-api';
import {
  fetchHeroMatch,
  fetchChallenges,
  fetchOpenMatches,
  fetchWeeklyMatches,
  fetchTournaments,
  getCachedData,
  setCachedData,
  checkStaleCache,
  clearFeedCache,
} from '../../api/feed-api';
import { logError } from '../../lib/error-logging';
import { IS_MOCK } from '../../contexts/MockModeContext';
import { MOCK_HERO_MATCH, MOCK_FEED_CHALLENGES, MOCK_FEED_OPEN_MATCHES, MOCK_CONVERSATIONS } from '../../data/mockDemoData';

// ─── Framer Motion transition variants ───────────────────────────────────────
// Ease curves: [0.32, 0, 0.67, 0] = ease-in-cubic (fast exit)
//              [0.33, 1, 0.68, 1] = ease-out-cubic (smooth landing)

const DURATION = 0.28;

/**
 * Validates FeedData structure to detect corrupted cache or invalid API responses
 * Checks that all required fields exist and have correct types
 * 
 * @param data - The FeedData object to validate
 * @returns true if data is valid, false if corrupted/invalid
 */
function validateFeedData(data: any): data is FeedData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check that all required top-level fields exist
  if (!('heroMatch' in data) || !('challenges' in data) || !('openMatches' in data) || 
      !('weeklyMatches' in data) || !('tournaments' in data)) {
    return false;
  }

  // Validate heroMatch (can be null or object)
  if (data.heroMatch !== null && typeof data.heroMatch !== 'object') {
    return false;
  }

  // Validate arrays
  if (!Array.isArray(data.challenges) || !Array.isArray(data.openMatches) || 
      !Array.isArray(data.weeklyMatches) || !Array.isArray(data.tournaments)) {
    return false;
  }

  // Basic validation passed
  return true;
}

const listVariants = {
  initial: { x: 0, opacity: 1 },
  exit: {
    x: '-30%',
    opacity: 0,
    transition: { duration: DURATION, ease: [0.32, 0, 0.67, 0] as const },
  },
};

const chatVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: DURATION, ease: [0.33, 1, 0.68, 1] as const },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: DURATION - 0.04, ease: [0.32, 0, 0.67, 0] as const },
  },
};

// View transition variants for segment switching (MATCHES <-> CIRCLES)
// Direction: 1 = MATCHES to CIRCLES (slide left), -1 = CIRCLES to MATCHES (slide right)
const VIEW_TRANSITION_DURATION = 0.3; // 300ms as per requirements

const viewTransitionVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

const viewTransitionConfig = {
  x: { 
    type: 'spring' as const, 
    stiffness: 300, 
    damping: 30,
    duration: VIEW_TRANSITION_DURATION,
  },
  opacity: { duration: 0.2 },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Root state machine for the Circles (Connect) tab.
 *
 * Manages navigation between:
 *  - 'list'  → CirclesListView (conversation list)
 *  - 'chat'  → ChatDetailView  (individual chat thread)
 *
 * Both views are absolutely positioned within this container so Framer Motion
 * can animate them simultaneously during the slide transition.
 */
export function CirclesPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const targetConversationId = (location.state as { openConversationId?: string } | null)?.openConversationId;

  // Desktop nav passes ?view=circles or ?view=matches to force initial segment.
  // targetConversationId always wins (deep link to a conversation).
  const viewParam = searchParams.get('view');
  const initialSegment: CirclesSegment = targetConversationId
    ? 'CIRCLES'
    : viewParam === 'circles'
    ? 'CIRCLES'
    : viewParam === 'matches'
    ? 'MATCHES'
    : 'CIRCLES';

  const [screen, setScreen] = useState<CirclesScreen>({ view: 'list' });
  const _realConvs = useConversations();
  const [mockConvs, setMockConvs] = useState(MOCK_CONVERSATIONS);
  const conversations = IS_MOCK ? mockConvs : _realConvs.conversations;
  const loading = IS_MOCK ? false : _realConvs.loading;
  const error = IS_MOCK ? null : _realConvs.error;
  const markAsRead = IS_MOCK
    ? async (id: string) => { setMockConvs(prev => prev.map(c => c.conversation.id === id ? { ...c, unreadCount: 0 } : c)); }
    : _realConvs.markAsRead;
  const refetch = IS_MOCK ? async () => {} : _realConvs.refetch;
  const hasMore = IS_MOCK ? false : _realConvs.hasMore;
  const loadMore = IS_MOCK ? async () => {} : _realConvs.loadMore;
  const loadingMore = IS_MOCK ? false : _realConvs.loadingMore;
  const { user, isGuest } = useAuth();
  const { tutorialStep, advanceTutorial } = useGuestTutorial();
  const { setHideNav } = useNavVisibility();
  const { isDesktop } = useResponsive();

  // New state for segmented control and feed data
  // If we have a target conversation, start on CIRCLES segment to avoid showing MATCHES first
  const [activeSegment, setActiveSegment] = useState<CirclesSegment>(initialSegment);

  // Sync segment when desktop nav tab changes (?view= param updates without unmounting)
  useEffect(() => {
    if (targetConversationId) return; // deep link takes priority
    if (viewParam === 'circles') {
      setActiveSegment('CIRCLES');
    } else if (viewParam === 'matches') {
      setActiveSegment('MATCHES');
      setScreen({ view: 'list' }); // reset chat so it doesn't bleed into matches tab
      setHideNav(false);
    }
  }, [viewParam, targetConversationId, setHideNav]);
  const [feedData, setFeedData] = useState<FeedData>(() =>
    IS_MOCK
      ? { heroMatch: MOCK_HERO_MATCH, challenges: MOCK_FEED_CHALLENGES, openMatches: MOCK_FEED_OPEN_MATCHES, weeklyMatches: [], tournaments: [] }
      : { heroMatch: null, challenges: [], openMatches: [], weeklyMatches: [], tournaments: [] }
  );
  const [feedLoading, setFeedLoading] = useState<boolean>(false);
  const [feedError, setFeedError] = useState<Error | null>(null);
  const [scrollPositions, setScrollPositions] = useState<{ MATCHES: number; CIRCLES: number }>({
    MATCHES: 0,
    CIRCLES: 0,
  });
  
  // Track direction for view transition animation
  // 1 = MATCHES to CIRCLES (slide left), -1 = CIRCLES to MATCHES (slide right)
  const [direction, setDirection] = useState<number>(0);

  // Scroll container refs for both views
  const matchesScrollRef = useRef<HTMLDivElement>(null);
  const circlesScrollRef = useRef<HTMLDivElement>(null);
  
  // Track if we've already auto-opened a conversation from location state
  const hasAutoOpenedRef = useRef(false);

  const openChat = useCallback((item: ConversationItem) => {
    setScreen({ view: 'chat', item });
    if (!isDesktop) setHideNav(true);
  }, [setHideNav, isDesktop]);

  const goBack = useCallback(() => {
    setScreen({ view: 'list' });
    if (!isDesktop) setHideNav(false);
  }, [setHideNav, isDesktop]);

  const handleSegmentChange = useCallback((segment: CirclesSegment) => {
    // Save current scroll position before switching
    const currentRef = activeSegment === 'MATCHES' ? matchesScrollRef : circlesScrollRef;
    if (currentRef.current) {
      setScrollPositions(prev => ({
        ...prev,
        [activeSegment]: currentRef.current!.scrollTop,
      }));
    }
    
    // Determine slide direction
    // MATCHES to CIRCLES = slide left (direction: 1)
    // CIRCLES to MATCHES = slide right (direction: -1)
    const newDirection = segment === 'CIRCLES' ? 1 : -1;
    setDirection(newDirection);
    
    setActiveSegment(segment);
    // Reset chat view when switching segments so it doesn't bleed into the other tab
    setScreen({ view: 'list' });
    setHideNav(false);
  }, [activeSegment, setHideNav]);

  const handleRefresh = useCallback(() => {
    if (!user) return;
    
    // Clear cache and refetch feed data
    setFeedLoading(true);
    setFeedError(null);
    
    fetchAllFeedData(user.id)
      .then((data) => {
        setFeedData(data);
        setFeedError(null);
      })
      .catch((error) => {
        const errorObj = error instanceof Error ? error : new Error('Failed to fetch feed data');
        setFeedError(errorObj);
        
        // Log error with context
        logError(errorObj, 'Feed Data Refresh', user.id);
      })
      .finally(() => {
        setFeedLoading(false);
      });
  }, [user]);

  const handleNewChat = useCallback(async (contactId: string, contactProfile: Profile) => {
    if (!user) return;

    // If a direct conversation already exists in the list, open it immediately
    const existing = conversations.find(
      (c) =>
        c.conversation.type === 'direct' &&
        c.otherParticipants[0]?.profile?.id === contactId
    );
    if (existing) {
      openChat(existing);
      return;
    }

    // Otherwise, get or create a new direct conversation
    const { conversationId, error: createErr } = await getOrCreateDirectConversation(
      user.id,
      contactId
    );
    if (!conversationId || createErr) return;

    // Refetch conversations so the new one appears, then open it
    await refetch();
    // After refetch the state will update; use a short delay to let state settle
    setTimeout(() => {
      setScreen((prev) => {
        if (prev.view === 'chat') return prev; // already navigated elsewhere
        // Will be resolved by the useEffect below once conversations updates
        return prev;
      });
      // Trigger open by storing the target id
      setPendingOpenId(conversationId);
    }, 100);
  }, [user, conversations, openChat, refetch]);

  const [pendingOpenId, setPendingOpenId] = useState<string | null>(null);

  // Open pending conversation once conversations list updates
  useEffect(() => {
    if (!pendingOpenId) return;
    const item = conversations.find((c) => c.conversation.id === pendingOpenId);
    if (item) {
      setPendingOpenId(null);
      openChat(item);
    }
  }, [pendingOpenId, conversations, openChat]);

  // Restore nav when unmounting
  useEffect(() => () => { setHideNav(false); }, [setHideNav]);

  // Tutorial: advance to emma_greeting when page first mounts during go_to_messages step
  useEffect(() => {
    if (isGuest && tutorialStep === 'go_to_messages') {
      advanceTutorial('emma_greeting');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tutorial: auto-open Emma's chat once Emma's greeting step is active
  useEffect(() => {
    if (!isGuest) return;
    if ((tutorialStep === 'emma_greeting' || tutorialStep === 'send_message') && screen.view === 'list') {
      const t = setTimeout(() => {
        openChat(EMMA_CONVERSATION_ITEM);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [tutorialStep, screen.view, isGuest]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open a conversation when navigated from invite acceptance or notification
  useEffect(() => {
    const targetId = (location.state as { openConversationId?: string } | null)?.openConversationId;
    if (!targetId || loading || hasAutoOpenedRef.current) return;
    const item = conversations.find(c => c.conversation.id === targetId);
    if (item) {
      // Open chat immediately without animation delay
      setScreen({ view: 'chat', item });
      setHideNav(true);
      hasAutoOpenedRef.current = true;
      window.history.replaceState({}, '', '/circles');
    }
  }, [conversations, loading, location.state, setHideNav]);

  /**
   * Fetch all feed data in parallel for the MATCHES view
   * Checks cache first, then fetches fresh data if needed
   * 
   * @param userId - The user ID to fetch feed data for
   * @returns Promise<FeedData> containing all feed sections
   */
  const fetchAllFeedData = async (userId: string): Promise<FeedData> => {
    // Check cache first
    const cachedData = getCachedData('all');
    if (cachedData) {
      return cachedData;
    }

    // Fetch all feed data in parallel
    const [heroMatch, challenges, openMatches, weeklyMatches, tournaments] = 
      await Promise.all([
        fetchHeroMatch(userId),
        fetchChallenges(userId),
        fetchOpenMatches(userId),
        fetchWeeklyMatches(userId),
        fetchTournaments(userId),
      ]);

    // Construct FeedData object
    const data: FeedData = {
      heroMatch,
      challenges,
      openMatches,
      weeklyMatches,
      tournaments,
    };

    // Cache data for 5 minutes
    setCachedData('all', data);
    
    return data;
  };

  // Fetch feed data when MATCHES segment is active
  useEffect(() => {
    // Edge Case 1: Handle unauthenticated user
    if (activeSegment !== 'MATCHES') {
      return;
    }

    if (IS_MOCK) return;

    if (!user) {
      // User is not authenticated - show appropriate state
      setFeedLoading(false);
      setFeedError(new Error('UNAUTHENTICATED'));
      return;
    }

    // Create AbortController for cleanup
    const controller = new AbortController();

    // Check cache first
    const cachedData = getCachedData('all');
    if (cachedData) {
      // Edge Case 2: Validate cached data format
      if (validateFeedData(cachedData)) {
        // Use cached data if available, fresh, and valid
        setFeedData(cachedData);
        setFeedLoading(false);
        setFeedError(null);
        return;
      } else {
        // Edge Case 5: Cache is corrupted - clear it and fetch fresh
        logError(
          new Error('Corrupted cache detected'),
          'Feed Data Cache Validation',
          user.id,
          { cachedData }
        );
        clearFeedCache();
      }
    }

    // No cache or stale/corrupted cache - fetch fresh data
    setFeedLoading(true);
    setFeedError(null);

    // Edge Case 3: Handle network timeout (30 second timeout)
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort();
        const timeoutError = new Error('NETWORK_TIMEOUT');
        
        logError(timeoutError, 'Feed Data Fetching Timeout', user.id, {
          activeSegment,
          timeout: 30000,
        });

        // Try to use stale cache as fallback
        const staleCachedData = checkStaleCache('all');
        if (staleCachedData && validateFeedData(staleCachedData)) {
          setFeedData(staleCachedData);
          setFeedError(timeoutError);
        } else {
          setFeedError(timeoutError);
        }
        setFeedLoading(false);
      }
    }, 30000); // 30 second timeout

    fetchAllFeedData(user.id)
      .then((data) => {
        clearTimeout(timeoutId);
        
        // Only update state if request wasn't aborted
        if (!controller.signal.aborted) {
          // Edge Case 4: Validate fetched data format
          if (validateFeedData(data)) {
            setFeedData(data);
            setFeedError(null);
          } else {
            // Invalid data format returned from API
            const validationError = new Error('INVALID_DATA_FORMAT');
            logError(validationError, 'Feed Data Validation', user.id, {
              data,
              activeSegment,
            });
            
            // Try to use stale cache as fallback
            const staleCachedData = checkStaleCache('all');
            if (staleCachedData && validateFeedData(staleCachedData)) {
              setFeedData(staleCachedData);
              setFeedError(validationError);
            } else {
              setFeedError(validationError);
            }
          }
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        
        // Only update state if request wasn't aborted
        if (!controller.signal.aborted) {
          const errorObj = error instanceof Error ? error : new Error('Failed to fetch feed data');
          
          // Log error with context
          logError(errorObj, 'Feed Data Fetching', user.id, {
            activeSegment,
            hasCachedData: !!checkStaleCache('all'),
            errorName: errorObj.name,
            errorMessage: errorObj.message,
          });
          
          // On fetch failure, check for stale cached data as fallback
          const staleCachedData = checkStaleCache('all');
          
          if (staleCachedData && validateFeedData(staleCachedData)) {
            // Use stale cached data and show error banner
            setFeedData(staleCachedData);
            setFeedError(errorObj);
          } else {
            // No cached data at all - show error state
            setFeedError(errorObj);
          }
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        
        // Only update state if request wasn't aborted
        if (!controller.signal.aborted) {
          setFeedLoading(false);
        }
      });

    // Cleanup function to abort pending requests
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [activeSegment, user]);

  // Add scroll event listener for MATCHES view container
  useEffect(() => {
    const container = matchesScrollRef.current;
    if (!container || activeSegment !== 'MATCHES') return;

    const handleScroll = () => {
      setScrollPositions(prev => ({
        ...prev,
        MATCHES: container.scrollTop,
      }));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [activeSegment]);

  // Add scroll event listener for CIRCLES view container
  useEffect(() => {
    const container = circlesScrollRef.current;
    if (!container || activeSegment !== 'CIRCLES') return;

    const handleScroll = () => {
      setScrollPositions(prev => ({
        ...prev,
        CIRCLES: container.scrollTop,
      }));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [activeSegment]);

  // Restore scroll position after segment change
  useEffect(() => {
    const container = activeSegment === 'MATCHES' ? matchesScrollRef.current : circlesScrollRef.current;
    if (!container) return;

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      container.scrollTop = scrollPositions[activeSegment];
    });
  }, [activeSegment, scrollPositions]);

  // ── Desktop: WhatsApp-like two-panel layout for CIRCLES segment ──────────────
  if (isDesktop && activeSegment === 'CIRCLES') {
    const selectedId = screen.view === 'chat' ? screen.item.conversation.id : undefined;
    return (
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, background: 'var(--color-bg)' }}>
        {/* Left panel — conversation list */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
            borderRight: '1px solid var(--color-bdr)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-bg)',
          }}
        >
          <CirclesView
            conversations={conversations}
            loading={loading}
            error={error}
            onOpenChat={openChat}
            onNewChat={handleNewChat}
            scrollContainerRef={circlesScrollRef}
            selectedConversationId={selectedId}
            hasMore={hasMore}
            loadMore={loadMore}
            loadingMore={loadingMore}
          />
        </div>

        {/* Right panel — active chat thread or empty state */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {screen.view === 'chat' ? (
            <ChatDetailView
              conversationItem={screen.item}
              onBack={goBack}
              markAsRead={markAsRead}
              hideBackButton
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                background: 'var(--color-bg)',
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'var(--color-surf)',
                border: '1px solid var(--color-bdr)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Users size={22} strokeWidth={1.5} style={{ color: 'var(--color-t3)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-t2)',
                  margin: '0 0 4px',
                  letterSpacing: '-0.01em',
                }}>
                  No conversation selected
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  color: 'var(--color-t3)',
                  margin: 0,
                }}>
                  Choose from your circles on the left
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Mobile / Matches: existing full-screen animated behavior ─────────────────
  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {screen.view === 'list' && (
          <motion.div
            key="circles-list"
            variants={listVariants}
            initial="initial"
            animate="initial"
            exit="exit"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              willChange: 'transform',
            }}
          >
            {/* Segmented Control - hidden on desktop (nav tabs handle switching) */}
            <div className="lg:hidden">
              <SegmentedControl
                activeSegment={activeSegment}
                onSegmentChange={handleSegmentChange}
              />
            </div>

            {/* Nested AnimatePresence for segment view transitions */}
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {activeSegment === 'MATCHES' ? (
                <motion.div
                  key="matches-view"
                  custom={direction}
                  variants={viewTransitionVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={viewTransitionConfig}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    willChange: 'transform, opacity',
                  }}
                >
                  <MatchesView
                    feedData={feedData}
                    loading={feedLoading}
                    error={feedError}
                    onRefresh={handleRefresh}
                    scrollContainerRef={matchesScrollRef}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="circles-view"
                  custom={direction}
                  variants={viewTransitionVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={viewTransitionConfig}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    willChange: 'transform, opacity',
                  }}
                >
                  <CirclesView
                    conversations={conversations}
                    loading={loading}
                    error={error}
                    onOpenChat={openChat}
                    onNewChat={handleNewChat}
                    scrollContainerRef={circlesScrollRef}
                    hasMore={hasMore}
                    loadMore={loadMore}
                    loadingMore={loadingMore}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {screen.view === 'chat' && (
          <motion.div
            key={`chat-${screen.item.conversation.id}`}
            variants={chatVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              willChange: 'transform',
            }}
          >
            <ChatDetailView
              conversationItem={screen.item}
              onBack={goBack}
              markAsRead={markAsRead}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
