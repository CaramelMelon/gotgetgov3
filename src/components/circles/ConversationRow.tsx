import React from 'react';
import { Avatar } from '../../design-system';
import type { ConversationItem } from '../../types/circles';
import { SPORT_CARD_PREFIX, MATCH_PROPOSAL_PREFIX, ATTACHMENT_PREFIX } from '../../types/circles';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getPreviewText(content: string | undefined | null): string {
  if (!content) return '';
  if (content.startsWith(SPORT_CARD_PREFIX)) return 'Training goal shared';
  if (content.startsWith(MATCH_PROPOSAL_PREFIX)) return 'Match proposal';
  if (content.startsWith(ATTACHMENT_PREFIX)) return '📎 Attachment';
  return content.length > 55 ? content.slice(0, 55) + '…' : content;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ConversationRowProps {
  item: ConversationItem;
  onClick: (item: ConversationItem) => void;
  isSelected?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ConversationRow({ item, onClick, isSelected = false }: ConversationRowProps) {
  const timestamp = formatTimestamp(item.lastActivity);
  const preview = getPreviewText(item.lastMessage?.content);
  const hasUnread = item.unreadCount > 0;
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={() => onClick(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        width: '100%',
        padding: '9px 14px 9px 12px',
        background: isSelected
          ? 'var(--color-surf)'
          : hovered
          ? 'color-mix(in srgb, var(--color-surf-2) 60%, transparent)'
          : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        borderRadius: 10,
        transition: 'background 0.12s',
        position: 'relative',
        // Left accent bar for selected state
        boxShadow: isSelected
          ? 'inset 3px 0 0 var(--color-acc)'
          : 'none',
      }}
    >
      {/* Avatar + online indicator */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar
          name={item.displayName}
          imageUrl={item.displayAvatarUrl ?? undefined}
          size="md"
        />
        {item.isOnline && (
          <div
            style={{
              position: 'absolute',
              bottom: 1,
              right: 1,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--color-acc)',
              border: '2px solid var(--color-bg)',
            }}
          />
        )}
      </div>

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: name + timestamp */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 3,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: hasUnread ? 700 : 600,
              color: 'var(--color-t1)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '62%',
              letterSpacing: '-0.01em',
            }}
          >
            {item.displayName}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              color: hasUnread ? 'var(--color-acc)' : 'var(--color-t3)',
              fontWeight: hasUnread ? 600 : 400,
              flexShrink: 0,
              marginLeft: 6,
              letterSpacing: '0.01em',
            }}
          >
            {timestamp}
          </span>
        </div>

        {/* Row 2: preview + unread badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: hasUnread ? 'var(--color-t2)' : 'var(--color-t3)',
              fontWeight: hasUnread ? 500 : 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              lineHeight: 1.3,
            }}
          >
            {preview || 'Start the conversation'}
          </span>

          {hasUnread && (
            <div
              style={{
                flexShrink: 0,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: 'var(--color-acc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#fff',
                  lineHeight: 1,
                  letterSpacing: '0.02em',
                }}
              >
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
