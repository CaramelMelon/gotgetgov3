import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronRight, PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import { SPORTS } from '@/types';
import type { MatchResult, PendingScoreMatch, SportType } from '@/types';
import { ScoreMatchModal } from '@/components/results';
import { fetchMatchResults, fetchPendingScoreMatches, fetchPendingConfirmations, confirmResult, disputeResult } from '@/lib/scoring';
import { supabase } from '@/lib/supabase';
import { getInitials } from '@/lib/avatar-utils';
import {
  sampleLadderStandings as mockLadderStandings,
  sampleLeagueStandings as mockLeagueStandings,
  sampleTournaments as mockTournaments,
} from '@/data/mock';

// Sport filter pill — "all" means no filter
type SportFilter = SportType | 'all';

type ResultsFilter = 'my' | 'club' | 'all';
type SubFilter = 'matches' | 'ladders' | 'leagues' | 'tournaments';

interface LadderStanding {
  id: string;
  position: number;
  previousPosition: number;
  player: { name: string; avatarUrl?: string };
  matchesPlayed: number;
  matchesWon: number;
  ladderName: string;
}

const sampleLadderStandings: LadderStanding[] = mockLadderStandings as LadderStanding[];

/* ─── tiny helpers ─────────────────────────────────────────────────────── */

function Avatar({ name, avatarUrl, size = 40 }: { name: string; avatarUrl?: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden', background: 'var(--color-surf-2)',
      border: '2px solid var(--color-bdr)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontFamily: 'var(--font-body)', fontSize: size * 0.35, fontWeight: 700, color: 'var(--color-t2)' }}>
            {getInitials(name)}
          </span>
      }
    </div>
  );
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 6,
      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
      letterSpacing: '0.04em',
      background: bg, color,
    }}>
      {label}
    </span>
  );
}

/* ─── main page ────────────────────────────────────────────────────────── */

export function ResultsPage() {
  const { resultsFilter, resultsSubFilter } = useFilters();
  const { user } = useAuth();
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [preselectedMatch, setPreselectedMatch] = useState<PendingScoreMatch | undefined>();

  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [pendingScoreMatches, setPendingScoreMatches] = useState<PendingScoreMatch[]>([]);
  const [pendingConfirmations, setPendingConfirmations] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userSports, setUserSports] = useState<SportType[]>([]);
  const [sportFilter, setSportFilter] = useState<SportFilter>('all');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [disputingId, setDisputingId] = useState<string | null>(null);

  const activeFilter = (resultsFilter as ResultsFilter) || 'my';
  const activeSubFilter = (resultsSubFilter as SubFilter) || 'matches';

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_sport_profiles')
      .select('sport')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          const sports = [...new Set(data.map((r: { sport: string }) => r.sport as SportType))];
          setUserSports(sports);
        }
      });
  }, [user]);

  const loadData = async (sport?: SportType) => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const [resultsRes, pendingRes, confirmationsRes] = await Promise.all([
      fetchMatchResults(user.id, sport),
      fetchPendingScoreMatches(user.id),
      fetchPendingConfirmations(user.id),
    ]);

    if (resultsRes.error) {
      setError(resultsRes.error.message);
    } else {
      setMatchResults(resultsRes.data || []);
    }

    setPendingScoreMatches(pendingRes.data || []);
    setPendingConfirmations(confirmationsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData(sportFilter === 'all' ? undefined : (sportFilter as SportType));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sportFilter]);

  const handleMatchScored = () => {
    setShowScoreModal(false);
    setPreselectedMatch(undefined);
    loadData(sportFilter === 'all' ? undefined : (sportFilter as SportType));
  };

  const handleConfirm = async (resultId: string) => {
    setConfirmingId(resultId);
    await confirmResult(resultId);
    setConfirmingId(null);
    loadData(sportFilter === 'all' ? undefined : (sportFilter as SportType));
  };

  const handleDispute = async (resultId: string) => {
    if (!user) return;
    setDisputingId(resultId);
    await disputeResult(resultId, user.id);
    setDisputingId(null);
    loadData(sportFilter === 'all' ? undefined : (sportFilter as SportType));
  };

  const confirmedResults = matchResults.filter((m) => m.status === 'confirmed');
  const wins = confirmedResults.filter((m) => {
    const myPlayer = m.players.find((p) => p.userId === user?.id);
    return myPlayer && m.winnerTeam === myPlayer.teamNumber;
  }).length;
  const stats = {
    matchesPlayed: confirmedResults.length,
    wins,
    winRate: confirmedResults.length > 0 ? `${Math.round((wins / confirmedResults.length) * 100)}%` : '0%',
  };

  return (
    <div style={{ paddingBottom: 24, paddingLeft: 16, paddingRight: 16, paddingTop: 16 }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
          color: 'var(--color-t1)', margin: 0, letterSpacing: '-0.02em',
        }}>
          My Results
        </h1>
        <button
          onClick={() => setShowScoreModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--color-acc)', color: '#000',
            border: 'none', borderRadius: 'var(--radius-full)',
            padding: '8px 18px', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 700,
            fontSize: 'var(--text-sm)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <PlusCircle size={15} />
          Score Match
        </button>
      </div>

      <ScoreMatchModal
        open={showScoreModal}
        onOpenChange={(open) => {
          setShowScoreModal(open);
          if (!open) setPreselectedMatch(undefined);
        }}
        onScored={handleMatchScored}
        preselectedMatch={preselectedMatch}
      />

      {activeFilter === 'my' && activeSubFilter === 'matches' && (
        <div>
          {/* ── Sport filter pills ─────────────────────────────────────── */}
          {userSports.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--color-t3)', margin: '0 0 8px',
              }}>
                Sport
              </p>
              <div className="hide-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as never, paddingBottom: 2 }}>
                {(['all', ...userSports] as SportFilter[]).map((sp) => {
                  const active = sportFilter === sp;
                  return (
                    <button
                      key={sp}
                      onClick={() => setSportFilter(sp)}
                      style={{
                        padding: '7px 18px',
                        borderRadius: 'var(--radius-full)',
                        border: active ? 'none' : '1px solid var(--color-bdr)',
                        background: active ? 'var(--color-acc)' : 'var(--color-surf)',
                        color: active ? '#fff' : 'var(--color-t2)',
                        fontFamily: 'var(--font-body)', fontWeight: 600,
                        fontSize: 13, cursor: 'pointer',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sp === 'all' ? 'All' : SPORTS[sp]?.name || sp}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0' }}>
              <Loader2 size={28} style={{ color: 'var(--color-acc)', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0' }}>
              <AlertCircle size={28} style={{ color: 'var(--color-red)' }} />
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t2)', margin: 0 }}>{error}</p>
              <button
                onClick={() => loadData(sportFilter === 'all' ? undefined : (sportFilter as SportType))}
                style={{
                  padding: '8px 20px', borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-bdr)', background: 'var(--color-surf)',
                  color: 'var(--color-t1)', fontFamily: 'var(--font-body)', fontWeight: 600,
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* ── Needs Score ──────────────────────────────────────── */}
              {pendingScoreMatches.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 20, color: 'var(--color-t1)', marginBottom: 10, marginTop: 0,
                  }}>
                    Needs Score
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pendingScoreMatches.map((match) => (
                      <button
                        key={match.challengeId}
                        onClick={() => { setPreselectedMatch(match); setShowScoreModal(true); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', borderRadius: 'var(--radius-xl)',
                          border: '1px solid rgba(255,179,0,0.35)',
                          background: 'rgba(255,179,0,0.06)',
                          textAlign: 'left', cursor: 'pointer', width: '100%',
                        }}
                      >
                        <Avatar name={match.opponent.name} avatarUrl={match.opponent.avatarUrl} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--color-t1)', margin: 0, fontSize: 14 }}>
                            vs {match.opponent.name}
                          </p>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t2)', margin: '2px 0 0' }}>
                            {SPORTS[match.sport]?.name || match.sport} · {formatDate(match.confirmedTime)}
                          </p>
                        </div>
                        <ChevronRight size={16} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Pending Confirmation ─────────────────────────────── */}
              {pendingConfirmations.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 20, color: 'var(--color-t1)', marginBottom: 10, marginTop: 0,
                  }}>
                    Pending Confirmation
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pendingConfirmations.map((result) => {
                      const submitter = result.players.find((p) => p.userId === result.submittedBy);
                      return (
                        <div
                          key={result.id}
                          style={{
                            padding: '14px 16px', borderRadius: 'var(--radius-xl)',
                            background: 'var(--color-surf)',
                            border: '1px solid var(--color-bdr)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar name={submitter?.name || 'Player'} avatarUrl={submitter?.avatarUrl} size={36} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--color-t1)', margin: 0, fontSize: 14 }}>
                                {submitter?.name || 'Opponent'} submitted a score
                              </p>
                              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t2)', margin: '2px 0 0' }}>
                                {SPORTS[result.sport]?.name || result.sport} · {result.score.formatted} · {formatDate(result.playedAt)}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button
                              disabled={confirmingId === result.id || disputingId === result.id}
                              onClick={() => handleConfirm(result.id)}
                              style={{
                                flex: 1, height: 38, borderRadius: 10,
                                border: '1px solid #FFB300', background: 'rgba(255,179,0,0.08)',
                                color: '#FFB300', fontFamily: 'var(--font-body)', fontWeight: 700,
                                fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                opacity: confirmingId === result.id ? 0.6 : 1,
                              }}
                            >
                              {confirmingId === result.id ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Confirm'}
                            </button>
                            <button
                              disabled={confirmingId === result.id || disputingId === result.id}
                              onClick={() => handleDispute(result.id)}
                              style={{
                                flex: 1, height: 38, borderRadius: 10,
                                border: '1px solid var(--color-red)', background: 'rgba(255,59,48,0.08)',
                                color: 'var(--color-red)', fontFamily: 'var(--font-body)', fontWeight: 700,
                                fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                opacity: disputingId === result.id ? 0.6 : 1,
                              }}
                            >
                              {disputingId === result.id ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Dispute'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── ELO Sparkline ─────────────────────────────────────── */}
              {confirmedResults.length >= 2 && (
                <EloSparkline matches={confirmedResults} currentUserId={user?.id} />
              )}

              {/* ── Stats ─────────────────────────────────────────────── */}
              <StatsOverview stats={stats} />

              {/* ── History ───────────────────────────────────────────── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-t3)',
                }}>
                  Match History
                </span>
                {matchResults.length > 0 && (
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                    background: 'var(--color-surf-2)', color: 'var(--color-t2)',
                    padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  }}>
                    {matchResults.length}
                  </span>
                )}
              </div>

              {matchResults.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  padding: '32px 20px',
                  background: 'var(--color-surf)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1.5px dashed var(--color-bdr)',
                }}>
                  <Trophy size={28} style={{ color: 'var(--color-t3)' }} />
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t3)', margin: 0, textAlign: 'center' }}>
                    No matches recorded yet
                  </p>
                  <button
                    onClick={() => setShowScoreModal(true)}
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                      color: 'var(--color-acc)', background: 'none', border: 'none',
                      cursor: 'pointer', padding: 0,
                    }}
                  >
                    Score your first match
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {matchResults.map((match) => (
                    <MatchCard key={match.id} match={match} currentUserId={user?.id} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Ladder Standings ──────────────────────────────────────────────── */}
      {activeSubFilter === 'ladders' && (
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--color-t1)', textAlign: 'center', marginBottom: 14 }}>
            Ladder Standings
          </h2>
          <div style={{ background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            {sampleLadderStandings.map((standing) => (
              <LadderRow key={standing.id} standing={standing} isCurrentUser={standing.player.name === 'Me'} />
            ))}
          </div>
        </div>
      )}

      {activeSubFilter === 'leagues' && <LeagueStandings />}
      {activeSubFilter === 'tournaments' && <TournamentResults />}
    </div>
  );
}

/* ─── ELO Sparkline ────────────────────────────────────────────────────── */

function EloSparkline({ matches, currentUserId }: { matches: MatchResult[]; currentUserId?: string }) {
  const confirmed = matches
    .filter((m) => m.status === 'confirmed')
    .slice()
    .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime());

  if (confirmed.length < 2) return null;

  // Build running ELO from a 1200 base
  const BASE = 1200;
  const WIN_DELTA = 20;
  const LOSS_DELTA = -15;
  const points: number[] = [BASE];
  for (const m of confirmed) {
    const me = m.players.find((p) => p.userId === currentUserId);
    const won = me && m.winnerTeam === me.teamNumber;
    points.push(points[points.length - 1] + (won ? WIN_DELTA : LOSS_DELTA));
  }

  const W = 480;
  const H = 64;
  const pad = 8;
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const toY = (v: number) => H - pad - ((v - minVal) / range) * (H - pad * 2);

  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
  const lastUp = points[points.length - 1] >= points[points.length - 2];
  const color = lastUp ? 'var(--color-acc)' : 'var(--color-red)';
  const currentElo = points[points.length - 1];

  return (
    <div style={{
      background: 'var(--color-surf)', border: '1px solid var(--color-bdr)',
      borderRadius: 'var(--radius-xl)', padding: '16px 20px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-t3)', margin: 0 }}>
            ELO Trend
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--color-t1)', letterSpacing: '-0.02em', margin: '4px 0 0' }}>
            {currentElo}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {lastUp
            ? <TrendingUp size={16} style={{ color: 'var(--color-acc)' }} />
            : <TrendingDown size={16} style={{ color: 'var(--color-red)' }} />}
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: lastUp ? 'var(--color-acc)' : 'var(--color-red)' }}>
            {lastUp ? '+' : ''}{points[points.length - 1] - points[points.length - 2]}
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Fill area */}
        <path
          d={`${path} L ${toX(points.length - 1).toFixed(1)} ${H} L ${toX(0).toFixed(1)} ${H} Z`}
          fill="url(#sparkGrad)"
        />
        {/* Line */}
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* End dot */}
        <circle cx={toX(points.length - 1)} cy={toY(points[points.length - 1])} r="4" fill={color} />
      </svg>
    </div>
  );
}

/* ─── StatsOverview ────────────────────────────────────────────────────── */

interface StatsData { matchesPlayed: number; wins: number; winRate: string; }

function StatsOverview({ stats }: { stats: StatsData }) {
  const losses = stats.matchesPlayed - stats.wins;
  const items = [
    { label: 'Played', value: String(stats.matchesPlayed) },
    { label: 'Record', value: stats.matchesPlayed > 0 ? `${stats.wins}W · ${losses}L` : '—' },
    { label: 'Win Rate', value: stats.winRate },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
      {items.map(({ label, value }) => (
        <div
          key={label}
          style={{
            background: 'var(--color-surf)', border: '1px solid var(--color-bdr)',
            borderRadius: 'var(--radius-xl)', padding: '14px 10px', textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--color-t1)', margin: 0, letterSpacing: '-0.02em' }}>
            {value}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t3)', margin: '4px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ─── MatchCard ────────────────────────────────────────────────────────── */

function MatchCard({ match, currentUserId }: { match: MatchResult; currentUserId?: string }) {
  const sport = SPORTS[match.sport as keyof typeof SPORTS];
  const myPlayer = match.players.find((p) => p.userId === currentUserId);
  const won = myPlayer ? match.winnerTeam === myPlayer.teamNumber : false;
  const opponent = match.players.find((p) => p.userId !== currentUserId);

  const isWin = match.status === 'confirmed' && won;
  const isPending = match.status === 'pending';
  const isDisputed = match.status === 'disputed';

  const leftColor = isPending
    ? '#FFB300'
    : isDisputed
    ? 'var(--color-red)'
    : isWin
    ? 'var(--color-acc)'
    : 'var(--color-red)';

  const resultLabel = isPending ? 'Awaiting' : isDisputed ? 'Disputed' : isWin ? 'W' : 'L';
  const resultColor = leftColor;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 14px', borderRadius: 'var(--radius-xl)',
      background: 'var(--color-surf)', border: '1px solid var(--color-bdr)',
      borderLeft: `3px solid ${leftColor}`,
      transition: 'border-color 0.12s',
    }}>
      {/* Result badge */}
      <div style={{
        width: 28, flexShrink: 0, textAlign: 'center',
        fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800,
        color: resultColor, letterSpacing: '0.02em',
      }}>
        {resultLabel}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--color-t1)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          vs {opponent?.name || 'Opponent'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t2)' }}>
            {match.score.formatted || '—'}
          </span>
          <span style={{ color: 'var(--color-bdr-s)', fontSize: 10 }}>·</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t3)' }}>
            {sport?.name || match.sport}
          </span>
        </div>
      </div>

      {/* Date */}
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t3)', flexShrink: 0, margin: 0 }}>
        {formatDate(match.playedAt)}
      </p>
    </div>
  );
}

/* ─── LadderRow ────────────────────────────────────────────────────────── */

function LadderRow({ standing, isCurrentUser }: { standing: LadderStanding; isCurrentUser: boolean }) {
  const positionChange = standing.previousPosition - standing.position;

  const positionColor =
    standing.position === 1 ? '#FFB300' :
    standing.position === 2 ? 'var(--color-t2)' :
    standing.position === 3 ? '#CD7F32' :
    'var(--color-t3)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px',
      borderBottom: '1px solid var(--color-bdr)',
      background: isCurrentUser ? 'var(--color-acc-bg)' : 'transparent',
    }}>
      <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: positionColor }}>
          {standing.position}
        </span>
      </div>

      <div style={{ width: 22, flexShrink: 0 }}>
        {positionChange > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-acc)' }}>
            <TrendingUp size={14} />
            <span style={{ fontSize: 11 }}>{positionChange}</span>
          </div>
        )}
        {positionChange < 0 && (
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-red)' }}>
            <TrendingDown size={14} />
            <span style={{ fontSize: 11 }}>{Math.abs(positionChange)}</span>
          </div>
        )}
        {positionChange === 0 && <Minus size={14} style={{ color: 'var(--color-t3)' }} />}
      </div>

      <Avatar name={standing.player.name} avatarUrl={standing.player.avatarUrl} size={34} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: isCurrentUser ? 'var(--color-acc)' : 'var(--color-t1)', margin: 0 }}>
          {standing.player.name}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t2)', margin: '2px 0 0' }}>
          {standing.matchesWon}W – {standing.matchesPlayed - standing.matchesWon}L
        </p>
      </div>

      <ChevronRight size={18} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
    </div>
  );
}

/* ─── LeagueStandings ──────────────────────────────────────────────────── */

function LeagueStandings() {
  const standings = mockLeagueStandings;
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--color-t1)', textAlign: 'center', marginBottom: 14 }}>
        League Standings
      </h2>
      <div style={{ background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-surf-2)' }}>
                {['#', 'Team', 'P', 'W', 'D', 'L', 'Pts'].map((header, i) => (
                  <th key={header} style={{
                    padding: '10px 12px', textAlign: i <= 1 ? 'left' : 'center',
                    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11,
                    letterSpacing: '0.06em', color: 'var(--color-t3)',
                    borderBottom: '1px solid var(--color-bdr)',
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr key={row.position} style={{ borderTop: '1px solid var(--color-bdr)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--color-t1)', fontSize: 13 }}>{row.position}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', color: 'var(--color-t1)', fontSize: 13 }}>{row.team}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--color-t2)', fontSize: 13 }}>{row.played}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--color-t2)', fontSize: 13 }}>{row.won}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--color-t2)', fontSize: 13 }}>{row.drawn}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--color-t2)', fontSize: 13 }}>{row.lost}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--color-t1)', fontSize: 13 }}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── TournamentResults ────────────────────────────────────────────────── */

function TournamentResults() {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--color-t1)', textAlign: 'center', marginBottom: 14 }}>
        Tournament Results
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mockTournaments.map((tournament) => (
          <div
            key={tournament.id}
            style={{
              padding: '16px', borderRadius: 'var(--radius-xl)',
              background: 'var(--color-surf)', border: '1px solid var(--color-bdr)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--color-t1)', margin: 0 }}>
                {tournament.name}
              </h3>
              <Chip
                label={tournament.status}
                color={tournament.status === 'Completed' ? 'var(--color-acc)' : '#FFB300'}
                bg={tournament.status === 'Completed' ? 'var(--color-acc-bg)' : 'rgba(255,179,0,0.12)'}
              />
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t2)', margin: '0 0 6px' }}>
              {tournament.format}
            </p>
            {tournament.winner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trophy size={16} style={{ color: '#FFB300' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-t1)' }}>
                  Winner: {tournament.winner}
                </span>
              </div>
            )}
            {tournament.nextRound && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t2)', margin: '4px 0 0' }}>
                {tournament.nextRound}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
