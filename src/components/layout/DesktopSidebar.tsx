import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Zap, TrendingUp, Clock, MapPin } from 'lucide-react';
import { format, isToday, isTomorrow, startOfDay } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SPORTS, type SportType } from '../../types';
import { fetchMatchResults } from '../../lib/scoring';
import type { MatchResult } from '../../types';

// Discover has its own two-column layout (swipe deck + player panel) — sidebar would make 3 cols
const SIDEBAR_ROUTES = ['/news', '/schedule', '/results', '/circles'];

function shouldShowSidebar(pathname: string) {
  return SIDEBAR_ROUTES.some((r) => pathname.startsWith(r));
}

// ─── Widget shell ─────────────────────────────────────────────────────────────

function Widget({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div
      style={{
        background: 'var(--color-surf)',
        border: '1px solid var(--color-bdr)',
        borderRadius: 16,
        padding: '14px 16px',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--color-t3)',
          margin: '0 0 10px',
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── ELO Widget ───────────────────────────────────────────────────────────────

type SportProfile = {
  sport: SportType;
  self_assessed_level: string;
  official_rating: string | null;
};

const LEVEL_ELO: Record<string, number> = {
  beginner: 1000,
  intermediate: 1200,
  advanced: 1400,
  expert: 1600,
  professional: 1800,
};

function EloWidget({ userId }: { userId: string }) {
  const [profiles, setProfiles] = useState<SportProfile[]>([]);

  useEffect(() => {
    supabase
      .from('user_sport_profiles')
      .select('sport, self_assessed_level, official_rating')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) setProfiles(data as SportProfile[]);
      });
  }, [userId]);

  if (profiles.length === 0) return null;

  return (
    <Widget title="Your ELO">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {profiles.map((p) => {
          const elo = p.official_rating
            ? parseInt(p.official_rating, 10)
            : LEVEL_ELO[p.self_assessed_level] ?? 1200;
          const sportName = SPORTS[p.sport]?.name || p.sport;
          return (
            <div key={p.sport} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--color-acc)', flexShrink: 0,
                  }}
                />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t2)' }}>
                  {sportName}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800,
                    color: 'var(--color-t1)', letterSpacing: '-0.02em',
                  }}
                >
                  {elo.toLocaleString()}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-t3)' }}>
                  ELO
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}

// ─── Upcoming Widget ──────────────────────────────────────────────────────────

type UpcomingItem = {
  id: string;
  title: string;
  date: Date;
  time: string;
  location?: string;
  type: 'match' | 'event' | 'competition';
  status: 'confirmed' | 'pending';
};

function formatUpcomingDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

function UpcomingWidget({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const now = startOfDay(new Date()).toISOString();

      const [eventsRes, challengesRes] = await Promise.all([
        supabase
          .from('event_registrations')
          .select(`event_id, events (id, name, start_time, court_name, clubs (name))`)
          .eq('user_id', userId),
        supabase
          .from('challenge_players')
          .select(`
            challenge_id, response,
            challenges (
              id, sport, proposed_times, location, status,
              clubs (name),
              challenge_players (user_id, profiles (id, full_name))
            )
          `)
          .eq('user_id', userId)
          .in('response', ['accepted', 'pending']),
      ]);

      const upcoming: UpcomingItem[] = [];

      (eventsRes.data ?? []).forEach((reg: any) => {
        const ev = reg.events;
        if (!ev) return;
        const date = new Date(ev.start_time);
        if (date < new Date()) return;
        upcoming.push({
          id: `event-${ev.id}`,
          title: ev.name,
          date,
          time: format(date, 'h:mm a'),
          location: ev.court_name || ev.clubs?.name,
          type: 'event',
          status: 'confirmed',
        });
      });

      (challengesRes.data ?? []).forEach((cp: any) => {
        const ch = cp.challenges;
        if (!ch || ch.status === 'cancelled') return;
        const proposedTimes: string[] = ch.proposed_times ?? [];
        const nextTime = proposedTimes
          .map((t: string) => new Date(t))
          .filter((d: Date) => d >= new Date())
          .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0];
        if (!nextTime) return;

        const opponent = (ch.challenge_players ?? [])
          .filter((p: any) => p.user_id !== userId)
          .map((p: any) => p.profiles?.full_name)
          .filter(Boolean)[0];

        upcoming.push({
          id: `challenge-${ch.id}`,
          title: opponent ? `vs ${opponent}` : SPORTS[ch.sport as SportType]?.name || ch.sport,
          date: nextTime,
          time: format(nextTime, 'h:mm a'),
          location: ch.location || ch.clubs?.name,
          type: 'match',
          status: cp.response === 'accepted' ? 'confirmed' : 'pending',
        });
      });

      upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
      setItems(upcoming.slice(0, 3));
      setLoading(false);
    }
    fetch();
  }, [userId]);

  if (loading) return null;

  return (
    <Widget title="Upcoming">
      {items.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 0' }}>
          <CalendarDays size={22} style={{ color: 'var(--color-t3)' }} />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', margin: 0, textAlign: 'center' }}>
            Nothing scheduled
          </p>
          <button
            onClick={() => navigate('/schedule')}
            style={{
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              color: 'var(--color-acc)', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0,
            }}
          >
            View schedule
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate('/schedule')}
              style={{
                display: 'flex', flexDirection: 'column', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', padding: '8px 10px',
                borderRadius: 10,
                borderLeft: `2px solid ${item.status === 'confirmed' ? 'var(--color-acc)' : 'var(--color-bdr-s)'}`,
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surf-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                    color: 'var(--color-t1)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {item.title}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-acc)', flexShrink: 0, fontWeight: 600 }}>
                  {formatUpcomingDate(item.date)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} style={{ color: 'var(--color-t3)' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t3)' }}>{item.time}</span>
                </div>
                {item.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={11} style={{ color: 'var(--color-t3)' }} />
                    <span
                      style={{
                        fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t3)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120,
                      }}
                    >
                      {item.location}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
          {items.length >= 3 && (
            <button
              onClick={() => navigate('/schedule')}
              style={{
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                color: 'var(--color-t2)', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left', padding: '0 10px',
              }}
            >
              View all
            </button>
          )}
        </div>
      )}
    </Widget>
  );
}

// ─── Win Streak Widget ────────────────────────────────────────────────────────

function WinStreakWidget({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [streak, setStreak] = useState<number | null>(null);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  useEffect(() => {
    fetchMatchResults(userId).then(({ data }) => {
      if (!data || data.length === 0) { setStreak(0); return; }

      const confirmed = (data as MatchResult[])
        .filter((m) => m.status === 'confirmed')
        .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());

      setTotalMatches(confirmed.length);

      const wins = confirmed.filter((m) => {
        const me = m.players.find((p) => p.userId === userId);
        return me && m.winnerTeam === me.teamNumber;
      });
      setTotalWins(wins.length);

      // Compute current streak
      let current = 0;
      for (const m of confirmed) {
        const me = m.players.find((p) => p.userId === userId);
        const won = me && m.winnerTeam === me.teamNumber;
        if (won) { current++; } else { break; }
      }
      setStreak(current);

      // Compute best streak
      let best = 0;
      let running = 0;
      for (const m of [...confirmed].reverse()) {
        const me = m.players.find((p) => p.userId === userId);
        const won = me && m.winnerTeam === me.teamNumber;
        if (won) { running++; best = Math.max(best, running); } else { running = 0; }
      }
      setBestStreak(best);
    });
  }, [userId]);

  if (streak === null) return null;

  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

  return (
    <Widget title="Performance">
      {totalMatches === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', margin: 0 }}>
            No matches recorded yet
          </p>
          <button
            onClick={() => navigate('/results')}
            style={{
              fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              color: 'var(--color-acc)', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, textAlign: 'left',
            }}
          >
            Score your first match
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: streak > 0 ? 'var(--color-acc-bg)' : 'var(--color-surf-2)',
                borderRadius: 12, padding: '8px 14px', minWidth: 56,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                  color: streak > 0 ? 'var(--color-acc)' : 'var(--color-t2)',
                  lineHeight: 1, letterSpacing: '-0.02em',
                }}
              >
                {streak}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-t3)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                streak
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t2)' }}>Win rate</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--color-t1)' }}>{winRate}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t2)' }}>Best streak</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--color-t1)' }}>{bestStreak}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t2)' }}>Played</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: 'var(--color-t1)' }}>{totalMatches}</span>
              </div>
            </div>
          </div>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={13} style={{ color: 'var(--color-acc)' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-acc)', fontWeight: 600 }}>
                {streak}-game win streak
              </span>
            </div>
          )}
        </div>
      )}
    </Widget>
  );
}

// ─── Quick Actions Widget ─────────────────────────────────────────────────────

function QuickActionsWidget() {
  const navigate = useNavigate();

  const actions = [
    { label: 'Find players', path: '/discover', icon: <Zap size={14} /> },
    { label: 'Score a match', path: '/results', icon: <TrendingUp size={14} /> },
    { label: 'My schedule', path: '/schedule', icon: <CalendarDays size={14} /> },
  ];

  return (
    <Widget title="Quick actions">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {actions.map((a) => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 6px', borderRadius: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              textAlign: 'left', width: '100%',
              color: 'var(--color-t2)',
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-surf-2)';
              e.currentTarget.style.color = 'var(--color-t1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--color-t2)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', opacity: 0.75 }}>{a.icon}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500 }}>{a.label}</span>
          </button>
        ))}
      </div>
    </Widget>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function DesktopSidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!shouldShowSidebar(location.pathname)) return null;

  return (
    <aside
      className="hidden lg:flex"
      style={{
        width: 248,
        flexShrink: 0,
        flexDirection: 'column',
        gap: 10,
        paddingTop: 'calc(var(--desktop-nav-height, 64px) + 20px)',
        paddingBottom: 32,
        paddingRight: 20,
        paddingLeft: 4,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {user ? (
        <>
          <EloWidget userId={user.id} />
          <UpcomingWidget userId={user.id} />
          <WinStreakWidget userId={user.id} />
        </>
      ) : (
        <QuickActionsWidget />
      )}
    </aside>
  );
}
