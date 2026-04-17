import { useRef, useEffect, forwardRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HeroSection,
  ChallengesSection,
  OpenMatchesSection,
  DigestSection,
  TournamentsSection,
  HeroSectionSkeleton,
  ChallengesSectionSkeleton,
  OpenMatchesSectionSkeleton,
  DigestSectionSkeleton,
  TournamentsSectionSkeleton,
} from '@/components/feed';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import type { FeedData } from '@/api/feed-api';
import type { FeedChallenge, FeedOpenMatch, FeedTournament } from '@/types/feed';
import { Trophy, X, MapPin, Clock, User, Calendar, CheckCircle2 } from 'lucide-react';
import { useMockMode } from '@/contexts/MockModeContext';
import { getInitials } from '@/lib/feed-utils';

// ─── Join Match Modal ─────────────────────────────────────────────────────────

interface JoinMatchModalProps {
  openMatch: FeedOpenMatch;
  onClose: () => void;
  onJoined: (openMatch: FeedOpenMatch) => void;
  isMockMode: boolean;
}

function JoinMatchModal({ openMatch, onClose, onJoined }: JoinMatchModalProps) {
  const [joined, setJoined] = useState(false);
  const [visible, setVisible] = useState(true);
  const { host, distance, hostElo } = openMatch;
  const { sport, confirmed_time, created_at, location, format, message } = openMatch.challenge;

  const sportName = sport.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const formatName = format ? format.charAt(0).toUpperCase() + format.slice(1) : 'Singles';
  const dateStr = confirmed_time || created_at;
  const date = new Date(dateStr);
  const displayDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const displayTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const dismiss = () => setVisible(false);

  const handleJoin = () => {
    setJoined(true);
    setTimeout(() => {
      onJoined(openMatch);
      dismiss();
    }, 800);
  };

  return (
    <AnimatePresence onExitComplete={onClose}>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={dismiss}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.48)',
              backdropFilter: 'blur(3px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001,
              width: '100%', maxWidth: 480, margin: '0 auto',
              background: 'var(--color-bg)',
              borderRadius: '24px 24px 0 0',
              padding: '8px 0 0',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 12 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--color-bdr)' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 16px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--color-t1)', margin: 0 }}>
                Match Details
              </h2>
              <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-t3)', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Host */}
            <div style={{ margin: '0 20px 16px', padding: 16, background: 'var(--color-surf)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-acc-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, color: 'var(--color-acc)' }}>
                  {getInitials(host.full_name)}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: 'var(--color-t1)', margin: '0 0 2px' }}>
                  {host.full_name}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t2)', margin: 0 }}>
                  Match Host{distance > 0 ? ` · ${distance} mi away` : ''}
                </p>
              </div>
              {hostElo && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--color-t1)', margin: 0, lineHeight: 1 }}>
                    {hostElo}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, color: 'var(--color-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '2px 0 0' }}>
                    ELO
                  </p>
                </div>
              )}
            </div>

            {/* Details grid */}
            <div style={{ margin: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: <Trophy size={14} />, label: 'Sport', value: sportName },
                { icon: <User size={14} />, label: 'Format', value: formatName },
                { icon: <Calendar size={14} />, label: 'Date', value: displayDate },
                { icon: <Clock size={14} />, label: 'Time', value: displayTime },
                ...(location ? [{ icon: <MapPin size={14} />, label: 'Location', value: location }] : []),
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ padding: '10px 12px', background: 'var(--color-surf)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, color: 'var(--color-t3)' }}>
                    {icon}
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-t1)', margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Host message */}
            {message && (
              <div style={{ margin: '0 20px 16px', padding: '12px 14px', background: 'var(--color-surf)', borderRadius: 14 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--color-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>Note from host</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t2)', margin: 0, lineHeight: 1.5 }}>{message}</p>
              </div>
            )}

            {/* Actions */}
            <div style={{ padding: '0 20px 36px', display: 'flex', gap: 10 }}>
              <button
                onClick={dismiss}
                style={{
                  flex: 1, padding: '14px 0', borderRadius: 99,
                  background: 'var(--color-surf)', border: '1.5px solid var(--color-bdr)',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                  color: 'var(--color-t2)', cursor: 'pointer',
                }}
              >
                Decline
              </button>
              <motion.button
                onClick={handleJoin}
                disabled={joined}
                whileTap={joined ? {} : { scale: 0.96 }}
                style={{
                  flex: 2, padding: '14px 0', borderRadius: 99,
                  background: joined ? 'color-mix(in srgb, var(--color-acc) 15%, transparent)' : 'var(--color-acc)',
                  border: joined ? '1.5px solid var(--color-acc)' : 'none',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                  color: joined ? 'var(--color-acc)' : '#fff',
                  cursor: joined ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'background 0.25s, color 0.25s, border 0.25s',
                }}
              >
                {joined ? <><CheckCircle2 size={16} /> Added to Schedule</> : 'Join Match'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// NetworkErrorBanner Component
interface NetworkErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function NetworkErrorBanner({ message, onRetry }: NetworkErrorBannerProps) {
  return (
    <div
      style={{
        background: 'rgba(232, 64, 64, 0.07)',
        border: '1px solid #E84040',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        margin: '16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <p style={{ fontWeight: 600, color: '#E84040', marginBottom: 4 }}>
          Connection Error
        </p>
        <p style={{ fontSize: 13, color: 'var(--color-t2)' }}>
          {message}
        </p>
      </div>
      <button
        onClick={onRetry}
        style={{
          background: '#E84040',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 16px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}

// EmptyMatchesState Component
interface EmptyMatchesStateProps {
  onFindMatches?: () => void;
}

export function EmptyMatchesState({ onFindMatches }: EmptyMatchesStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          background: 'var(--color-surf)',
          border: '1px solid var(--color-bdr)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Trophy size={36} style={{ color: 'var(--color-t3)' }} />
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--color-t1)',
          marginBottom: 8,
        }}
      >
        No activity yet
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--color-t2)',
          maxWidth: 280,
          marginBottom: 24,
        }}
      >
        Play some matches and join tournaments to see your feed come to life.
      </p>
      <button
        onClick={onFindMatches}
        style={{
          padding: '12px 28px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-acc)',
          color: '#fff',
          border: 'none',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Find Matches
      </button>
    </div>
  );
}

interface MatchesViewProps {
  feedData: FeedData;
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export const MatchesView = forwardRef<HTMLDivElement, MatchesViewProps>(
  function MatchesView({
    feedData,
    loading,
    error,
    onRefresh,
    scrollContainerRef,
  }, ref) {

  const isMockMode = useMockMode();
  const [joinModalMatch, setJoinModalMatch] = useState<FeedOpenMatch | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  const handleJoined = (openMatch: FeedOpenMatch) => {
    setJoinedIds((prev) => new Set(prev).add(openMatch.challenge.id));
  };

  // Handle section interactions (placeholder handlers)
  const handleShareClick = () => {
    console.log('Share clicked');
  };

  const handleOptionsClick = () => {
    console.log('Options clicked');
  };

  const handleRespondClick = (challenge: FeedChallenge) => {
    console.log('Respond to challenge:', challenge.challenge.id);
  };

  const handleJoinClick = (openMatch: FeedOpenMatch) => {
    setJoinModalMatch(openMatch);
  };

  const handleEnterClick = (tournament: FeedTournament) => {
    console.log('Enter tournament:', tournament.competition.id);
  };

  // Edge Case 1: Handle unauthenticated user
  if (error?.message === 'UNAUTHENTICATED') {
    return (
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '16px 16px 80px',
          background: 'var(--color-bg)',
          overscrollBehavior: 'auto',
          overscrollBehaviorY: 'auto',
          touchAction: 'pan-y',
        } as React.CSSProperties}
        data-view="matches"
      >
        <ErrorState
          message="Please sign in to view your matches and activity."
          onRetry={undefined}
        />
      </div>
    );
  }

  // Edge Case 3: Handle network timeout
  if (error?.message === 'NETWORK_TIMEOUT') {
    // Check if we have cached data to show
    const hasCachedData = feedData.heroMatch || feedData.challenges.length > 0 || 
                          feedData.openMatches.length > 0 || feedData.weeklyMatches.length > 0 || 
                          feedData.tournaments.length > 0;

    if (!hasCachedData) {
      return (
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 16px 80px',
            background: 'var(--color-bg)',
            overscrollBehavior: 'auto',
            overscrollBehaviorY: 'auto',
            touchAction: 'pan-y',
          } as React.CSSProperties}
          data-view="matches"
        >
          <ErrorState
            message="Request timed out. Please check your connection and try again."
            onRetry={onRefresh}
          />
        </div>
      );
    }
    // If we have cached data, show it with error banner below
  }

  // Edge Case 4: Handle invalid data format
  if (error?.message === 'INVALID_DATA_FORMAT') {
    // Check if we have cached data to show
    const hasCachedData = feedData.heroMatch || feedData.challenges.length > 0 || 
                          feedData.openMatches.length > 0 || feedData.weeklyMatches.length > 0 || 
                          feedData.tournaments.length > 0;

    if (!hasCachedData) {
      return (
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 16px 80px',
            background: 'var(--color-bg)',
            overscrollBehavior: 'auto',
            overscrollBehaviorY: 'auto',
            touchAction: 'pan-y',
          } as React.CSSProperties}
          data-view="matches"
        >
          <ErrorState
            message="Received invalid data from server. Please try again or contact support."
            onRetry={onRefresh}
          />
        </div>
      );
    }
    // If we have cached data, show it with error banner below
  }

  // Edge Case: General network/API errors without cached data
  if (error && !feedData.heroMatch && feedData.challenges.length === 0 && 
      feedData.openMatches.length === 0 && feedData.weeklyMatches.length === 0 && 
      feedData.tournaments.length === 0) {
    return (
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '16px 16px 80px',
          background: 'var(--color-bg)',
          overscrollBehavior: 'auto',
          overscrollBehaviorY: 'auto',
          touchAction: 'pan-y',
        } as React.CSSProperties}
        data-view="matches"
      >
        <ErrorState
          message="Unable to load your matches. Please try again."
          onRetry={onRefresh}
        />
      </div>
    );
  }

  // Edge Case 2: Check if all sections are empty (null/empty feedData)
  const hasNoData =
    !feedData.heroMatch &&
    feedData.challenges.length === 0 &&
    feedData.openMatches.length === 0 &&
    feedData.weeklyMatches.length === 0 &&
    feedData.tournaments.length === 0;

  // Show skeleton loading state
  if (loading && hasNoData) {
    return (
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          padding: '0 16px 80px',
          background: 'var(--color-bg)',
          overscrollBehavior: 'auto',
          overscrollBehaviorY: 'auto',
          touchAction: 'pan-y',
        } as React.CSSProperties}
        data-view="matches"
      >
        <HeroSectionSkeleton />
        <ChallengesSectionSkeleton />
        <OpenMatchesSectionSkeleton />
        <DigestSectionSkeleton />
        <TournamentsSectionSkeleton />
      </div>
    );
  }

  // Show empty state if no data at all
  if (hasNoData && !loading) {
    return (
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '16px 16px 80px',
          background: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overscrollBehavior: 'auto',
          overscrollBehaviorY: 'auto',
          touchAction: 'pan-y',
        } as React.CSSProperties}
        data-view="matches"
      >
        <EmptyMatchesState onFindMatches={() => console.log('Navigate to discover')} />
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        padding: '0 16px 80px',
        background: 'var(--color-bg)',
        overscrollBehavior: 'auto',
        overscrollBehaviorY: 'auto',
        touchAction: 'pan-y',
      } as React.CSSProperties}
      data-view="matches"
      data-testid="matches-view"
    >
      {/* Error banner if there's an error but we have cached data */}
      {error && (feedData.heroMatch || feedData.challenges.length > 0 || 
                 feedData.openMatches.length > 0 || feedData.weeklyMatches.length > 0 || 
                 feedData.tournaments.length > 0) && (
        <NetworkErrorBanner
          message={
            error.message === 'NETWORK_TIMEOUT' 
              ? 'Request timed out. Showing cached data. Tap to retry.'
              : error.message === 'INVALID_DATA_FORMAT'
              ? 'Received invalid data. Showing cached data. Tap to retry.'
              : 'Connection error. Showing cached data. Tap to retry.'
          }
          onRetry={onRefresh}
        />
      )}

      <HeroSection
        heroMatch={feedData.heroMatch}
        onShareClick={handleShareClick}
        onOptionsClick={handleOptionsClick}
        />
      <ChallengesSection challenges={feedData.challenges} onRespondClick={handleRespondClick} />
      <OpenMatchesSection
        openMatches={feedData.openMatches.filter((m) => !joinedIds.has(m.challenge.id))}
        onJoinClick={handleJoinClick}
      />
      <DigestSection matches={feedData.weeklyMatches} />
      <TournamentsSection tournaments={feedData.tournaments} onEnterClick={handleEnterClick} />
      <style>{`[data-view="matches"]::-webkit-scrollbar{display:none}`}</style>

      {joinModalMatch && createPortal(
        <AnimatePresence>
          <JoinMatchModal
            key={joinModalMatch.challenge.id}
            openMatch={joinModalMatch}
            onClose={() => setJoinModalMatch(null)}
            onJoined={handleJoined}
            isMockMode={isMockMode}
          />
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
});
