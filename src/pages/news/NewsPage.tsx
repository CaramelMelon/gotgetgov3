import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFilters } from '@/contexts/FilterContext';
import { useMockMode } from '@/contexts/MockModeContext';
import { MOCK_ME } from '@/data/mockDemoData';
import { supabase } from '@/lib/supabase';
import { getInitials } from '@/lib/avatar-utils';
import { NewsSkeleton } from '@/components/skeletons';

type NewsFilter = 'all' | 'circles' | 'club' | 'competitions';

interface FeedItem {
  id: string;
  type: 'announcement' | 'match_result' | 'ladder_movement' | 'event' | 'achievement' | 'connection_accepted';
  title?: string;
  content?: string;
  imageUrl?: string;
  gradientBg?: string;
  author: { id: string; name: string; avatarUrl?: string };
  audienceLabel?: string;
  metadata?: {
    winner?: string;
    loser?: string;
    score?: string;
    positionChange?: number;
    eventName?: string;
    eventId?: string;
    eventDate?: string;
    achievement?: string;
    connectedUser?: { id: string; name: string; avatarUrl?: string };
  };
  reactions: { like: number; celebrate: number; fire: number };
  comments: number;
  createdAt: string;
  category?: NewsFilter;
}

/* ── greeting helper ───────────────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ── mini avatar ───────────────────────────────────────────────────────── */
function MiniAvatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl?: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.15)',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.36, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)' }}>
            {getInitials(name)}
          </span>
      }
    </div>
  );
}

/* ── category badge config ─────────────────────────────────────────────── */
const categoryConfig: Record<string, { label: string; accent: string }> = {
  announcement:        { label: 'News',        accent: 'rgba(255,255,255,0.18)' },
  match_result:        { label: 'Match',        accent: 'rgba(22,212,106,0.35)' },
  ladder_movement:     { label: 'Ladder',       accent: 'rgba(139,92,246,0.35)' },
  event:               { label: 'Event',        accent: 'rgba(255,179,0,0.35)'  },
  achievement:         { label: 'Achievement',  accent: 'rgba(255,179,0,0.35)'  },
  connection_accepted: { label: 'Social',       accent: 'rgba(255,255,255,0.18)' },
};

/* ── main page ─────────────────────────────────────────────────────────── */
export function NewsPage() {
  const { user } = useAuth();
  const { newsFilter } = useFilters();
  const isMockMode = useMockMode();
  const [feed, setFeed] = useState<FeedItem[]>(() => {
    if (!isMockMode) return [];
    const ago = (h: number) => new Date(Date.now() - h * 3600000).toISOString();
    const me = { id: 'mock-me', name: MOCK_ME.fullName };
    const alex = { id: 'mock-p2', name: 'Alex Chen' };
    const marco = { id: 'mock-p6', name: 'Marco Rossi' };
    const jake = { id: 'mock-p4', name: 'Jake Williams' };

    const IMG = {
      tennis1:    '/images/tennis1.jpg',
      tennis2:    '/images/tennis2.jpg',
      tennisCt:   '/images/tennisCt.jpg',
      padel:      '/images/padel.jpg',
      pickleball: '/images/pickleball.jpg',
      squash:     '/images/squash.jpg',
      trophy:     '/images/trophy.jpg',
      stadium:    '/images/stadium.jpg',
      handshake:  '/images/handshake.jpg',
      clay:       '/images/clay.jpg',
    };

    const G = {
      tennis:  'linear-gradient(150deg, #0d2b1a 0%, #1b5e3b 60%, #276749 100%)',
      padel:   'linear-gradient(150deg, #051937 0%, #0a3d7a 60%, #1565c0 100%)',
      pickle:  'linear-gradient(150deg, #3b0764 0%, #6b21a8 60%, #9333ea 100%)',
      squash:  'linear-gradient(150deg, #1c0a00 0%, #7c2d12 60%, #c2410c 100%)',
      ladder:  'linear-gradient(150deg, #1a0a00 0%, #92400e 60%, #d97706 100%)',
      event:   'linear-gradient(150deg, #042f2e 0%, #115e59 60%, #0d9488 100%)',
      achieve: 'linear-gradient(150deg, #1a1400 0%, #854d0e 60%, #ca8a04 100%)',
      social:  'linear-gradient(150deg, #0f172a 0%, #1e3a5f 60%, #1e40af 100%)',
    };

    return [
      {
        id: 'mf-1', type: 'match_result' as const,
        imageUrl: IMG.tennis1, gradientBg: G.tennis,
        author: me,
        metadata: { winner: MOCK_ME.fullName, loser: 'Sara Johnson', score: '6–3, 6–4' },
        audienceLabel: 'Tennis · City Tennis Club',
        reactions: { like: 14, celebrate: 6, fire: 3 }, comments: 4,
        createdAt: ago(2), category: 'circles' as NewsFilter,
      },
      {
        id: 'mf-2', type: 'ladder_movement' as const,
        imageUrl: IMG.stadium, gradientBg: G.ladder,
        author: me,
        title: 'Climbing the ranks',
        metadata: { winner: MOCK_ME.fullName, positionChange: 3 },
        audienceLabel: 'Brooklyn Tennis Ladder · Now #8',
        reactions: { like: 21, celebrate: 9, fire: 5 }, comments: 6,
        createdAt: ago(5), category: 'competitions' as NewsFilter,
      },
      {
        id: 'mf-3', type: 'event' as const,
        imageUrl: IMG.tennisCt, gradientBg: G.event,
        author: { id: 'club-1', name: 'City Tennis Club' },
        title: 'Brooklyn Summer Open 2026',
        content: 'Open singles & doubles draw. Limited spots — register before Apr 25.',
        metadata: { eventName: 'Brooklyn Summer Open', eventDate: 'May 10–12, 2026' },
        audienceLabel: 'City Tennis Club · Members',
        reactions: { like: 38, celebrate: 17, fire: 9 }, comments: 12,
        createdAt: ago(8), category: 'club' as NewsFilter,
      },
      {
        id: 'mf-4', type: 'match_result' as const,
        imageUrl: IMG.padel, gradientBg: G.padel,
        author: me,
        metadata: { winner: `${MOCK_ME.fullName} & Sofia M.`, loser: 'Lucia F. & Ana P.', score: '6–2, 6–4' },
        audienceLabel: 'Padel Doubles · Padel Pro Club',
        reactions: { like: 11, celebrate: 4, fire: 2 }, comments: 3,
        createdAt: ago(18), category: 'circles' as NewsFilter,
      },
      {
        id: 'mf-5', type: 'achievement' as const,
        imageUrl: IMG.trophy, gradientBg: G.achieve,
        author: me,
        title: '10 Matches Milestone',
        metadata: { achievement: '10 ranked matches completed — ELO now 1247' },
        audienceLabel: 'GotGet Achievement',
        reactions: { like: 29, celebrate: 14, fire: 7 }, comments: 8,
        createdAt: ago(26), category: 'circles' as NewsFilter,
      },
      {
        id: 'mf-6', type: 'match_result' as const,
        imageUrl: IMG.squash, gradientBg: G.squash,
        author: marco,
        metadata: { winner: 'Marco Rossi', loser: MOCK_ME.fullName, score: '3–1' },
        audienceLabel: 'Squash Singles · Downtown Squash',
        reactions: { like: 7, celebrate: 2, fire: 1 }, comments: 2,
        createdAt: ago(36), category: 'circles' as NewsFilter,
      },
      {
        id: 'mf-7', type: 'connection_accepted' as const,
        imageUrl: IMG.handshake, gradientBg: G.social,
        author: me,
        metadata: { connectedUser: { id: 'mock-p2', name: 'Alex Chen' } },
        audienceLabel: 'New connection',
        reactions: { like: 8, celebrate: 3, fire: 1 }, comments: 1,
        createdAt: ago(42), category: 'circles' as NewsFilter,
      },
      {
        id: 'mf-8', type: 'announcement' as const,
        imageUrl: IMG.clay, gradientBg: G.event,
        author: { id: 'club-1', name: 'City Tennis Club' },
        title: '4 New Clay Courts Now Open',
        content: 'Book online through the app. Free for members during the first week.',
        audienceLabel: 'City Tennis Club · All Members',
        reactions: { like: 52, celebrate: 23, fire: 11 }, comments: 18,
        createdAt: ago(50), category: 'club' as NewsFilter,
      },
      {
        id: 'mf-9', type: 'match_result' as const,
        imageUrl: IMG.pickleball, gradientBg: G.pickle,
        author: jake,
        metadata: { winner: 'Jake Williams', loser: MOCK_ME.fullName, score: '11–5, 11–7' },
        audienceLabel: 'Pickleball Doubles · Sports Hub NYC',
        reactions: { like: 9, celebrate: 3, fire: 2 }, comments: 2,
        createdAt: ago(60), category: 'circles' as NewsFilter,
      },
      {
        id: 'mf-10', type: 'match_result' as const,
        imageUrl: IMG.tennis2, gradientBg: G.tennis,
        author: alex,
        metadata: { winner: 'Alex Chen', loser: 'Priya Patel', score: '7–5, 6–3' },
        audienceLabel: 'Tennis Singles · Riverside TC',
        reactions: { like: 16, celebrate: 7, fire: 3 }, comments: 5,
        createdAt: ago(72), category: 'circles' as NewsFilter,
      },
    ];
  });
  const [loading, setLoading] = useState(!isMockMode);

  const activeFilter = (newsFilter as NewsFilter) || 'all';
  const hasClubs = true;

  useEffect(() => {
    if (isMockMode) return;
    if (user) {
      fetchAcceptedConnections();
    }
    // Simulate initial load
    setTimeout(() => setLoading(false), 800);
  }, [user, isMockMode]);

  const fetchAcceptedConnections = async () => {
    if (!user) return;
    const { data: connectionsRaw } = await supabase
      .from('connections')
      .select(`id, user_id, connected_user_id, status, updated_at,
        user:user_id (id, full_name, avatar_url),
        connected:connected_user_id (id, full_name, avatar_url)`)
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false })
      .limit(10);
    const connections = connectionsRaw as any[] | null;

    if (connections && connections.length > 0) {
      const connectionItems: FeedItem[] = connections.map((conn) => {
        const userProfile = conn.user as { id: string; full_name: string; avatar_url: string | null } | null;
        const connectedProfile = conn.connected as { id: string; full_name: string; avatar_url: string | null } | null;
        return {
          id: `connection-${conn.id}`,
          type: 'connection_accepted' as const,
          author: { id: userProfile?.id || conn.user_id, name: userProfile?.full_name || 'Player', avatarUrl: userProfile?.avatar_url || undefined },
          metadata: { connectedUser: { id: connectedProfile?.id || conn.connected_user_id, name: connectedProfile?.full_name || 'Player', avatarUrl: connectedProfile?.avatar_url || undefined } },
          reactions: { like: Math.floor(Math.random() * 10), celebrate: Math.floor(Math.random() * 5), fire: Math.floor(Math.random() * 3) },
          comments: Math.floor(Math.random() * 5),
          createdAt: conn.updated_at,
          category: 'circles' as const,
        };
      });
      setFeed((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const newItems = connectionItems.filter((item) => !existingIds.has(item.id));
        return [...prev, ...newItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
    }
  };

  const filteredFeed = feed.filter((item) => activeFilter === 'all' || item.category === activeFilter);

  if (loading) {
    return <NewsSkeleton />;
  }

  /* empty state */
  if (!hasClubs) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', background: 'var(--color-bg)', minHeight: '60vh' }}>
        <div style={{ width: 80, height: 80, background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Building2 size={36} style={{ color: 'var(--color-t3)' }} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--color-t1)', marginBottom: 8, textAlign: 'center' }}>
          Join a club to see what's happening
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t2)', textAlign: 'center', maxWidth: 280, marginBottom: 24 }}>
          Connect with your local clubs to see match results, announcements, and more.
        </p>
        <button style={{
          padding: '12px 28px', borderRadius: 'var(--radius-full)',
          background: 'var(--color-acc)', color: '#fff', border: 'none',
          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
          Find Clubs
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-bg)', paddingBottom: 32 }}>

      {/* ── Greeting header ──────────────────────────────────────────────── */}
      <div style={{ padding: '22px 20px 16px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700,
          color: 'var(--color-t1)', letterSpacing: '-0.02em', margin: 0,
        }}>
          {greeting()}
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 14,
          color: 'var(--color-t2)', marginTop: 4, marginBottom: 0,
        }}>
          Latest updates from your network
        </p>
      </div>

      {/* ── Feed ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
        gap: 16,
        padding: '0 14px',
      }}>
        {filteredFeed.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

/* ── FeedCard ──────────────────────────────────────────────────────────── */
function FeedCard({ item }: { item: FeedItem }) {
  const [liked, setLiked] = useState(false);
  const config = categoryConfig[item.type] || { label: 'Update', accent: 'var(--color-bdr-s)' };

  const hasImage = !!(item.imageUrl || item.gradientBg);

  const headline = (() => {
    if (item.type === 'match_result' && item.metadata)
      return `${item.metadata.winner} defeated ${item.metadata.loser}`;
    if (item.type === 'ladder_movement' && item.metadata)
      return `${item.metadata.winner} moved up ${item.metadata.positionChange} spots!`;
    if (item.type === 'event' && item.metadata)
      return item.metadata.eventName || '';
    if (item.type === 'achievement' && item.metadata)
      return item.metadata.achievement || '';
    if (item.type === 'connection_accepted' && item.metadata?.connectedUser)
      return `${item.author.name} & ${item.metadata.connectedUser.name} are now connected`;
    return item.title || '';
  })();

  const textColor = hasImage ? '#fff' : 'var(--color-t1)';
  const textMuted = hasImage ? 'rgba(255,255,255,0.8)' : 'var(--color-t2)';
  const textSubtle = hasImage ? 'rgba(255,255,255,0.65)' : 'var(--color-t3)';
  const borderSubtle = hasImage ? 'rgba(255,255,255,0.15)' : 'var(--color-bdr)';
  const badgeBg = hasImage ? config.accent : 'var(--color-surf-2)';
  const badgeBorder = hasImage ? 'rgba(255,255,255,0.2)' : 'var(--color-bdr)';
  const badgeText = hasImage ? '#fff' : 'var(--color-t2)';

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 18,
      minHeight: hasImage ? 260 : 'auto',
      height: hasImage ? 260 : 'auto',
      background: hasImage ? '#111' : 'var(--color-surf)',
      border: hasImage ? 'none' : '1px solid var(--color-bdr)',
      padding: hasImage ? 0 : '16px 18px',
      boxShadow: hasImage ? '0 6px 28px rgba(0,0,0,0.35)' : '0 4px 12px rgba(0,0,0,0.03)',
    }}>
      {/* Background & Overlays (ONLY if image or gradient) */}
      {hasImage && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: item.gradientBg ?? '#111' }} />
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0.08) 100%)', pointerEvents: 'none' }} />
        </>
      )}

      {/* Category badge */}
      <div style={{ position: hasImage ? 'absolute' : 'relative', top: hasImage ? 14 : 0, left: hasImage ? 14 : 0, zIndex: 10, marginBottom: hasImage ? 0 : 16 }}>
        <div style={{
          padding: '5px 12px', borderRadius: 99,
          background: badgeBg,
          backdropFilter: hasImage ? 'blur(10px)' : 'none',
          border: `1px solid ${badgeBorder}`,
          display: 'inline-flex', alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: badgeText, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Content wrapper */}
      <div style={{ position: hasImage ? 'absolute' : 'relative', inset: hasImage ? 'auto 0 0 0' : 'auto', padding: hasImage ? '20px 18px 16px' : 0, zIndex: 10, color: textColor }}>

        {/* Headline */}
        {headline && (
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700,
            margin: '0 0 14px', lineHeight: 1.25,
            textShadow: hasImage ? '0 1px 4px rgba(0,0,0,0.5)' : 'none',
          }}>
            {headline}
          </h2>
        )}
        {item.type === 'announcement' && item.content && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: textMuted, margin: '-8px 0 14px', lineHeight: 1.4 }}>
            {item.content}
          </p>
        )}

        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          {hasImage 
            ? <MiniAvatar name={item.author.name} avatarUrl={item.author.avatarUrl} />
            : <div style={{width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surf-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
                {item.author.avatarUrl ? <img src={item.author.avatarUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/> : <span style={{fontSize: 13, fontWeight: 700, color: 'var(--color-t2)', fontFamily: 'var(--font-body)'}}>{getInitials(item.author.name)}</span>}
              </div>
          }
          <div>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, display: 'block', color: textColor }}>
              {item.author.name}
            </span>
            {item.audienceLabel && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: textSubtle }}>
                {item.audienceLabel}
              </span>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, paddingTop: 12, borderTop: `1px solid ${borderSubtle}` }}>
          <button
            onClick={() => setLiked((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', color: liked ? 'var(--color-red)' : textMuted, transition: 'color 0.2s', padding: 0 }}
          >
            <Heart size={19} fill={liked ? 'var(--color-red)' : 'none'} color={liked ? 'var(--color-red)' : textMuted} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }}>
              {item.reactions.like + (liked ? 1 : 0)}
            </span>
          </button>

          <button style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 0 }}>
            <MessageCircle size={19} />
            {item.comments > 0 && (
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }}>{item.comments}</span>
            )}
          </button>

          <button style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 0, marginLeft: 'auto' }}>
            <Share2 size={19} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }}>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
