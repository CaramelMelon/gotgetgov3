import { Clock, MapPin, MessageSquare, Globe, Lock } from 'lucide-react';
import type { FeedChallenge } from '@/types/feed';
import { getInitials, formatRelativeTime } from '@/lib/feed-utils';

interface ChallengeCardProps {
  challenge: FeedChallenge;
  onRespondClick: () => void;
}

export function ChallengeCard({ challenge, onRespondClick }: ChallengeCardProps) {
  const { challenger, isNew } = challenge;
  const { sport, confirmed_time, created_at, is_open, location, message } = challenge.challenge;

  const sportName = sport
    ? sport.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : 'Match';
  const initials = getInitials(challenger.full_name);
  const eloRating = '1450'; // TODO: Fetch from user_sport_profiles
  const dateTime = confirmed_time || created_at;
  const formattedTime = formatRelativeTime(dateTime);
  const isExpired = dateTime ? new Date(dateTime) < new Date() : false;

  return (
    <div
      style={{
        background: 'var(--color-surf)',
        borderRadius: '16px',
        border: '1px solid var(--color-bdr)',
        boxShadow: '0 1px 4px rgba(20,18,14,0.06), 0 6px 20px rgba(20,18,14,0.07)',
        padding: '13px 14px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: isExpired ? 0.65 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--color-acc-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-acc)',
          }}
        >
          {initials}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 5,
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--color-t1)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {challenger.full_name}
          </h3>
          {/* Visibility Badge */}
          <span
            style={{
              padding: '2px 7px',
              borderRadius: 99,
              background: is_open 
                ? 'rgba(34,197,94,0.08)' 
                : 'rgba(148,163,184,0.08)',
              border: is_open 
                ? '1px solid rgba(34,197,94,0.25)' 
                : '1px solid rgba(148,163,184,0.25)',
              fontSize: 10,
              fontWeight: 700,
              color: is_open ? '#16A34A' : '#64748B',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.04em',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {is_open ? <Globe size={9} /> : <Lock size={9} />}
            {is_open ? 'Open' : 'Private'}
          </span>
          {isNew && !isExpired && (
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 99,
                background: 'var(--color-acc-bg)',
                border: '1px solid var(--color-acc)',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--color-acc)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}
            >
              New
            </span>
          )}
          {isExpired && (
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 99,
                background: 'rgba(234,88,12,0.08)',
                border: '1px solid rgba(234,88,12,0.25)',
                fontSize: 10,
                fontWeight: 700,
                color: '#EA580C',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}
            >
              Expired
            </span>
          )}
        </div>

        {/* Meta row: sport pill + ELO chip + date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap' as const,
          }}
        >
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 99,
              background: 'var(--color-surf-2)',
              border: '1px solid var(--color-bdr)',
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-t2)',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {sportName}
          </span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 99,
              background: 'var(--color-acc-bg)',
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-acc)',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {eloRating}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={11} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--color-t3)',
              }}
            >
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Location (if available) */}
        {location && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 6,
            }}
          >
            <MapPin size={11} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--color-t2)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {location}
            </span>
          </div>
        )}

        {/* Message (if available) */}
        {message && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 4,
              marginTop: 6,
              padding: '6px 8px',
              background: 'var(--color-surf-2)',
              borderRadius: '8px',
              border: '1px solid var(--color-bdr)',
            }}
          >
            <MessageSquare size={11} style={{ color: 'var(--color-t3)', flexShrink: 0, marginTop: 2 }} />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 400,
                color: 'var(--color-t2)',
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {message}
            </span>
          </div>
        )}
      </div>

      {/* Respond button */}
      <button
        onClick={onRespondClick}
        disabled={isExpired}
        aria-label="Respond to challenge"
        style={{
          height: 34,
          padding: '0 14px',
          borderRadius: 99,
          background: isExpired ? 'var(--color-surf-2)' : 'var(--color-acc)',
          border: isExpired ? '1px solid var(--color-bdr)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isExpired ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!isExpired) e.currentTarget.style.background = 'var(--color-acc-dk)';
        }}
        onMouseLeave={(e) => {
          if (!isExpired) e.currentTarget.style.background = 'var(--color-acc)';
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 700,
            color: isExpired ? 'var(--color-t3)' : 'var(--color-t1)',
          }}
        >
          Respond
        </span>
      </button>
    </div>
  );
}
