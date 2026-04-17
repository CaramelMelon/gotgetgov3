import type { DiscoverPlayer } from '../types/discover';
import type { Notification, Profile } from '../types/database';
import type { User } from '@supabase/supabase-js';
import type { FeedHeroMatch, FeedOpenMatch, FeedChallenge } from '../types/feed';
import type { ConversationItem } from '../types/circles';

// ─── Mock Auth ────────────────────────────────────────────────────────────────

export const MOCK_AUTH_PROFILE: Profile = {
  id: 'mock-me',
  email: 'demo@gotget.app',
  full_name: 'Jordan Smith',
  avatar_url: null,
  bio: 'Demo profile. Passionate tennis and padel player.',
  phone: null,
  location_lat: 40.6782,
  location_lng: -73.9442,
  location_city: 'Brooklyn',
  location_country: 'US',
  home_club_id: null,
  onboarding_completed: true,
  dark_mode: false,
  push_notifications: false,
  email_notifications: false,
  last_seen: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_AUTH_USER = {
  id: 'mock-me',
  email: 'demo@gotget.app',
  app_metadata: {},
  user_metadata: { full_name: 'Jordan Smith' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as unknown as User;

// ─── Mock User ────────────────────────────────────────────────────────────────

export const MOCK_ME = {
  id: 'mock-me',
  fullName: 'Jordan Smith',
  locationCity: 'Brooklyn',
  eloRating: 1247,
  eloChange: +18,
  record: { wins: 24, losses: 12 },
  sports: [
    { name: 'Tennis', level: 'Advanced', rating: '7.8', ratingSystem: 'UTR' },
    { name: 'Padel', level: 'Intermediate', rating: undefined, ratingSystem: undefined },
  ],
  sparkline: [1190, 1210, 1198, 1225, 1231, 1215, 1228, 1240, 1229, 1247],
};

// ─── Mock Players ─────────────────────────────────────────────────────────────

export const MOCK_PLAYERS: DiscoverPlayer[] = [
  {
    id: 'mock-player-1',
    fullName: 'Sara Johnson',
    avatarUrl: '/images/avatars/sara.jpg',
    sport: 'tennis',
    sportName: 'Tennis',
    level: 'advanced',
    levelLabel: 'Advanced',
    distanceKm: 0.9,
    isActiveRecently: true,
    availability: 'flexible',
    preferredTime: 'morning',
    homeClub: 'City Tennis Club',
    scheduleOverlapLabel: '4h overlap',
    playStyle: 'aggressive baseline',
    compatibilityScore: 95,
    bio: 'Former college player. Love aggressive baseline tennis. Free most mornings and weekends.',
    age: 28,
    eloRating: 1310,
    ratingSystem: 'UTR',
    rating: '8.5',
    mutualConnections: 3,
    mutualConnectionNames: ['Mike T.', 'James L.', 'Anna K.'],
    responseRate: '95%',
    locationCity: 'Brooklyn',
    locationCountry: 'US',
    availabilityOverlap: 80,
    matchCompletionRate: 97,
    recentMatches: [
      { id: 'm1', result: 'W', opponentName: 'Alex C.', score: '6–3  6–2', date: 'Apr 15' },
      { id: 'm2', result: 'W', opponentName: 'Chris B.', score: '7–5  6–4', date: 'Apr 10' },
      { id: 'm3', result: 'L', opponentName: 'Emma R.', score: '4–6  3–6', date: 'Apr 5' },
      { id: 'm4', result: 'W', opponentName: 'David M.', score: '6–1  6–3', date: 'Mar 28' },
      { id: 'm5', result: 'W', opponentName: 'Laura P.', score: '6–4  7–5', date: 'Mar 22' },
    ],
  },
  {
    id: 'mock-player-2',
    fullName: 'Alex Chen',
    avatarUrl: '/images/avatars/alex.jpg',
    sport: 'tennis',
    sportName: 'Tennis',
    level: 'advanced',
    levelLabel: 'Advanced',
    distanceKm: 3.2,
    isActiveRecently: true,
    availability: 'weekends',
    preferredTime: 'afternoon',
    homeClub: 'Riverside TC',
    scheduleOverlapLabel: '2h overlap',
    playStyle: 'all-court',
    compatibilityScore: 89,
    bio: 'UTR 7.2. Play 3x a week. Looking for competitive hitting partners and singles matches.',
    age: 31,
    eloRating: 1280,
    ratingSystem: 'UTR',
    rating: '7.2',
    mutualConnections: 1,
    mutualConnectionNames: ['Mike T.'],
    responseRate: '88%',
    locationCity: 'Manhattan',
    locationCountry: 'US',
    availabilityOverlap: 55,
    matchCompletionRate: 91,
    recentMatches: [
      { id: 'm6', result: 'L', opponentName: 'Jordan S.', score: '3–6  4–6', date: 'Apr 14' },
      { id: 'm7', result: 'W', opponentName: 'Nina R.', score: '6–2  6–1', date: 'Apr 9' },
      { id: 'm8', result: 'W', opponentName: 'Sam K.', score: '7–6  6–3', date: 'Apr 3' },
      { id: 'm9', result: 'L', opponentName: 'Tom W.', score: '5–7  2–6', date: 'Mar 27' },
    ],
  },
  {
    id: 'mock-player-3',
    fullName: 'Sofia Martinez',
    avatarUrl: '/images/avatars/sofia.jpg',
    sport: 'padel',
    sportName: 'Padel',
    level: 'intermediate',
    levelLabel: 'Intermediate',
    distanceKm: 1.8,
    isActiveRecently: true,
    availability: 'evenings',
    preferredTime: 'evening',
    homeClub: 'Padel Pro Club',
    scheduleOverlapLabel: '3h overlap',
    playStyle: 'defensive',
    compatibilityScore: 92,
    bio: 'Padel enthusiast for 3 years. Love mixed doubles. Available evenings and Saturdays.',
    age: 26,
    eloRating: 1190,
    mutualConnections: 2,
    mutualConnectionNames: ['Anna K.', 'Carlos V.'],
    responseRate: '92%',
    locationCity: 'Brooklyn',
    locationCountry: 'US',
    availabilityOverlap: 72,
    matchCompletionRate: 95,
    recentMatches: [
      { id: 'm10', result: 'W', opponentName: 'Lucia F.', score: '6–4  6–2', date: 'Apr 13' },
      { id: 'm11', result: 'W', opponentName: 'Maria G.', score: '7–5  6–3', date: 'Apr 7' },
      { id: 'm12', result: 'L', opponentName: 'Ana P.', score: '3–6  4–6', date: 'Apr 1' },
    ],
  },
  {
    id: 'mock-player-4',
    fullName: 'Jake Williams',
    avatarUrl: '/images/avatars/jake.jpg',
    sport: 'pickleball',
    sportName: 'Pickleball',
    level: 'expert',
    levelLabel: 'Expert',
    distanceKm: 4.5,
    isActiveRecently: false,
    availability: 'weekdays',
    preferredTime: 'morning',
    homeClub: 'Sports Hub NYC',
    scheduleOverlapLabel: '1h overlap',
    playStyle: 'net dominator',
    compatibilityScore: 76,
    bio: 'DUPR 5.1. Competitive player seeking 4.5+ partners. Strategy-focused with strong net game.',
    age: 35,
    eloRating: 1420,
    ratingSystem: 'DUPR',
    rating: '5.1',
    mutualConnections: 0,
    responseRate: '79%',
    locationCity: 'Queens',
    locationCountry: 'US',
    availabilityOverlap: 30,
    matchCompletionRate: 88,
    recentMatches: [
      { id: 'm13', result: 'W', opponentName: 'Bob H.', score: '11–5  11–7', date: 'Apr 16' },
      { id: 'm14', result: 'W', opponentName: 'Dan P.', score: '11–3  11–4', date: 'Apr 12' },
      { id: 'm15', result: 'W', opponentName: 'Greg M.', score: '11–8  11–9', date: 'Apr 8' },
      { id: 'm16', result: 'L', opponentName: 'Pro T.', score: '5–11  4–11', date: 'Apr 2' },
      { id: 'm17', result: 'W', opponentName: 'Ted B.', score: '11–6  11–5', date: 'Mar 26' },
    ],
  },
  {
    id: 'mock-player-5',
    fullName: 'Priya Patel',
    avatarUrl: '/images/avatars/priya.jpg',
    sport: 'tennis',
    sportName: 'Tennis',
    level: 'intermediate',
    levelLabel: 'Intermediate',
    distanceKm: 2.1,
    isActiveRecently: true,
    availability: 'flexible',
    preferredTime: 'flexible',
    homeClub: 'Park Slope TC',
    scheduleOverlapLabel: '5h overlap',
    playStyle: 'consistent baseliner',
    compatibilityScore: 85,
    bio: 'Love rallying and learning new techniques. Looking for friendly competitive matches.',
    age: 29,
    eloRating: 1155,
    ratingSystem: 'UTR',
    rating: '5.4',
    mutualConnections: 2,
    mutualConnectionNames: ['Mike T.', 'Anna K.'],
    responseRate: '96%',
    locationCity: 'Brooklyn',
    locationCountry: 'US',
    availabilityOverlap: 90,
    matchCompletionRate: 98,
    recentMatches: [
      { id: 'm18', result: 'W', opponentName: 'Lila R.', score: '6–3  6–4', date: 'Apr 15' },
      { id: 'm19', result: 'L', opponentName: 'Sara J.', score: '2–6  1–6', date: 'Apr 11' },
      { id: 'm20', result: 'W', opponentName: 'Kate D.', score: '6–2  6–1', date: 'Apr 6' },
      { id: 'm21', result: 'W', opponentName: 'Nisha P.', score: '7–5  6–4', date: 'Mar 30' },
    ],
  },
  {
    id: 'mock-player-6',
    fullName: 'Marco Rossi',
    avatarUrl: '/images/avatars/marco.jpg',
    sport: 'squash',
    sportName: 'Squash',
    level: 'advanced',
    levelLabel: 'Advanced',
    distanceKm: 5.0,
    isActiveRecently: false,
    availability: 'evenings',
    preferredTime: 'evening',
    homeClub: 'Downtown Squash',
    scheduleOverlapLabel: '1.5h overlap',
    playStyle: 'counter-puncher',
    compatibilityScore: 71,
    bio: 'SquashLevels 6.8. Training for the city championship. Open to competitive practice games.',
    age: 33,
    eloRating: 1335,
    ratingSystem: 'SquashLevels',
    rating: '6.8',
    mutualConnections: 1,
    mutualConnectionNames: ['James L.'],
    responseRate: '82%',
    locationCity: 'Manhattan',
    locationCountry: 'US',
    availabilityOverlap: 40,
    matchCompletionRate: 90,
    recentMatches: [
      { id: 'm22', result: 'W', opponentName: 'Luca B.', score: '3–1', date: 'Apr 14' },
      { id: 'm23', result: 'W', opponentName: 'Pierre M.', score: '3–0', date: 'Apr 8' },
      { id: 'm24', result: 'L', opponentName: 'Diego F.', score: '1–3', date: 'Apr 3' },
    ],
  },
];

// ─── Mock Notifications ───────────────────────────────────────────────────────

const t = (offsetMs: number) => new Date(Date.now() - offsetMs).toISOString();
const h = (n: number) => n * 3600000;
const d = (n: number) => n * 86400000;

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'mock-me',
    type: 'swipe_right_received',
    title: 'Sara Johnson liked your profile',
    body: 'She wants to connect — Tennis · Advanced',
    data: {
      swiper_id: 'mock-player-1',
      target_user_id: 'mock-me',
      sport: 'tennis',
      connection_state: 'pending',
      senderName: 'Sara Johnson',
      senderAvatarUrl: '/images/avatars/sara.jpg',
    },
    read: false,
    created_at: t(h(1)),
  },
  {
    id: 'notif-2',
    user_id: 'mock-me',
    type: 'connection_request_received',
    title: 'Alex Chen wants to connect',
    body: 'Alex Chen sent you a connection request',
    data: { requester_id: 'mock-player-2', requesterName: 'Alex Chen', request_id: 'req-1' },
    read: false,
    created_at: t(h(2.5)),
  },
  {
    id: 'notif-3',
    user_id: 'mock-me',
    type: 'challenge_received',
    title: 'Priya Patel challenged you',
    body: 'Tennis · Singles · Sat Apr 19, 10:00 AM · Park Slope TC',
    data: { challenger_id: 'mock-player-5', challenger_name: 'Priya Patel', sport: 'tennis', challenge_id: 'chal-1' },
    read: false,
    created_at: t(h(4)),
  },
  {
    id: 'notif-4',
    user_id: 'mock-me',
    type: 'score_confirmation_request',
    title: 'Confirm your match score',
    body: 'Priya Patel submitted: 6–3, 4–6, 6–2. Please confirm.',
    data: { submitter_id: 'mock-player-5', submitterName: 'Priya Patel', match_id: 'match-1' },
    read: false,
    created_at: t(d(1) + h(2)),
  },
  {
    id: 'notif-5',
    user_id: 'mock-me',
    type: 'score_reminder',
    title: "Don't forget to score your match",
    body: 'You played Alex Chen yesterday. Submit the result.',
    data: { opponent_id: 'mock-player-2', opponentName: 'Alex Chen', match_id: 'match-2' },
    read: false,
    created_at: t(d(1) + h(6)),
  },
  {
    id: 'notif-6',
    user_id: 'mock-me',
    type: 'connection_request_accepted',
    title: 'Sofia Martinez accepted your connection',
    body: 'You and Sofia are now connected. Send her a message!',
    data: { acceptor_id: 'mock-player-3', acceptorName: 'Sofia Martinez', conversation_id: 'conv-1' },
    read: true,
    created_at: t(d(2) + h(1)),
  },
  {
    id: 'notif-7',
    user_id: 'mock-me',
    type: 'challenge_accepted',
    title: 'Marco Rossi accepted your challenge',
    body: 'Squash · Singles · Mon Apr 21, 6:30 PM · Downtown Squash',
    data: { opponent_id: 'mock-player-6', opponent_name: 'Marco Rossi', challenge_id: 'chal-2' },
    read: true,
    created_at: t(d(3) + h(3)),
  },
  {
    id: 'notif-8',
    user_id: 'mock-me',
    type: 'challenge_declined',
    title: 'Jake Williams declined your challenge',
    body: 'Jake cannot make it. Try scheduling another time.',
    data: { opponent_id: 'mock-player-4', opponent_name: 'Jake Williams', challenge_id: 'chal-3' },
    read: true,
    created_at: t(d(3) + h(8)),
  },
  {
    id: 'notif-9',
    user_id: 'mock-me',
    type: 'match_result',
    title: 'Match result confirmed',
    body: 'vs Sara Johnson · 6–3, 6–4 · +18 ELO',
    data: { opponent_id: 'mock-player-1', opponent_name: 'Sara Johnson', elo_change: 18, match_id: 'match-3' },
    read: true,
    created_at: t(d(5) + h(2)),
  },
  {
    id: 'notif-10',
    user_id: 'mock-me',
    type: 'ladder_position_change',
    title: 'You moved up in the Tennis Ladder',
    body: 'New position: #8 in the Brooklyn Tennis Ladder',
    data: { ladder_id: 'ladder-1', old_position: 11, new_position: 8, sport: 'tennis' },
    read: true,
    created_at: t(d(10) + h(1)),
  },
];

// ─── Mock Schedule ────────────────────────────────────────────────────────────

export interface MockScheduleEntry {
  id: string;
  opponent: string;
  sport: string;
  format: string;
  dateLabel: string;
  time: string;
  location: string;
  status: 'confirmed' | 'pending' | 'open';
}

export const MOCK_SCHEDULE: MockScheduleEntry[] = [
  {
    id: 'sched-past-1',
    opponent: 'Sara Johnson',
    sport: 'Tennis',
    format: 'Singles',
    dateLabel: 'Past-3',
    time: '10:00 AM',
    location: 'City Tennis Club',
    status: 'confirmed',
  },
  {
    id: 'sched-past-2',
    opponent: 'Jake Williams',
    sport: 'Pickleball',
    format: 'Doubles',
    dateLabel: 'Past-7',
    time: '6:00 PM',
    location: 'Sports Hub NYC',
    status: 'confirmed',
  },
  {
    id: 'sched-past-3',
    opponent: 'Marco Rossi',
    sport: 'Squash',
    format: 'Singles',
    dateLabel: 'Past-12',
    time: '7:30 PM',
    location: 'Downtown Squash',
    status: 'confirmed',
  },
  {
    id: 'sched-0',
    opponent: 'Priya Patel',
    sport: 'Tennis',
    format: 'Singles',
    dateLabel: 'Today',
    time: '7:00 PM',
    location: 'City Tennis Club',
    status: 'confirmed',
  },
  {
    id: 'sched-1',
    opponent: 'Alex Chen',
    sport: 'Tennis',
    format: 'Singles',
    dateLabel: 'Tomorrow',
    time: '9:00 AM',
    location: 'City Tennis Club',
    status: 'confirmed',
  },
  {
    id: 'sched-2',
    opponent: 'Sofia Martinez + 1',
    sport: 'Padel',
    format: 'Doubles',
    dateLabel: 'Days+2',
    time: '2:00 PM',
    location: 'Padel Pro Club',
    status: 'confirmed',
  },
  {
    id: 'sched-3',
    opponent: 'Open Match',
    sport: 'Pickleball',
    format: 'Doubles',
    dateLabel: 'Days+3',
    time: '10:00 AM',
    location: 'Sports Hub NYC',
    status: 'open',
  },
  {
    id: 'sched-4',
    opponent: 'Marco Rossi',
    sport: 'Squash',
    format: 'Singles',
    dateLabel: 'Days+4',
    time: '6:30 PM',
    location: 'Downtown Squash',
    status: 'pending',
  },
  {
    id: 'sched-5',
    opponent: 'Open Match',
    sport: 'Tennis',
    format: 'Singles',
    dateLabel: 'Days+6',
    time: '8:00 AM',
    location: 'City Tennis Club',
    status: 'open',
  },
];

// ─── Mock Recent Matches (profile / feed) ─────────────────────────────────────

export interface MockRecentMatch {
  id: string;
  opponent: string;
  sport: string;
  score: string;
  result: 'W' | 'L';
  eloChange: number;
  dateLabel: string;
  club: string;
}

export const MOCK_RECENT_MATCHES: MockRecentMatch[] = [
  {
    id: 'rm-1',
    opponent: 'Sara Johnson',
    sport: 'Tennis',
    score: '6–3, 6–4',
    result: 'W',
    eloChange: +18,
    dateLabel: 'Apr 15',
    club: 'City Tennis Club',
  },
  {
    id: 'rm-2',
    opponent: 'Alex Chen',
    sport: 'Tennis',
    score: '6–3, 4–6, 6–2',
    result: 'W',
    eloChange: +14,
    dateLabel: 'Apr 12',
    club: 'Riverside TC',
  },
  {
    id: 'rm-3',
    opponent: 'Marco Rossi',
    sport: 'Squash',
    score: '1–3',
    result: 'L',
    eloChange: -12,
    dateLabel: 'Apr 8',
    club: 'Downtown Squash',
  },
  {
    id: 'rm-4',
    opponent: 'Priya Patel',
    sport: 'Tennis',
    score: '7–5, 6–3',
    result: 'W',
    eloChange: +10,
    dateLabel: 'Apr 5',
    club: 'Park Slope TC',
  },
  {
    id: 'rm-5',
    opponent: 'Jake Williams',
    sport: 'Pickleball',
    score: '5–11, 4–11',
    result: 'L',
    eloChange: -14,
    dateLabel: 'Apr 2',
    club: 'Sports Hub NYC',
  },
  {
    id: 'rm-6',
    opponent: 'Sofia Martinez',
    sport: 'Padel',
    score: '6–2, 6–4',
    result: 'W',
    eloChange: +16,
    dateLabel: 'Mar 28',
    club: 'Padel Pro Club',
  },
];

// ─── Mock Feed Data (Circles / Matches tab) ───────────────────────────────────

const mockOpponentSara: Profile = {
  id: 'mock-p1', full_name: 'Sara Johnson', avatar_url: null,
  email: null, bio: null, phone: null,
  location_lat: 40.68, location_lng: -73.95, location_city: 'Brooklyn', location_country: 'US',
  home_club_id: null, onboarding_completed: true, dark_mode: false,
  push_notifications: false, email_notifications: false,
  last_seen: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
};

const mockOpponentAlex: Profile = {
  ...mockOpponentSara, id: 'mock-p2', full_name: 'Alex Chen',
};

const mockOpponentPriya: Profile = {
  ...mockOpponentSara, id: 'mock-p5', full_name: 'Priya Patel',
};

const mockOpponentJake: Profile = {
  ...mockOpponentSara, id: 'mock-p4', full_name: 'Jake Williams',
};

const pastDate = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const futureDate = (daysAhead: number) => new Date(Date.now() + daysAhead * 86400000).toISOString();

export const MOCK_HERO_MATCH: FeedHeroMatch = {
  match: {
    id: 'mock-match-1', sport: 'tennis', format: 'singles',
    club_id: null, ladder_id: null, competition_id: null, competition_fixture_id: null,
    scheduled_at: pastDate(3), played_at: pastDate(3),
    score: { sets: [{ home: 6, away: 3 }, { home: 6, away: 4 }] },
    score_status: 'confirmed', score_submitted_by: 'mock-me', score_confirmed_by: 'mock-p1',
    dispute_reason: null, winner_team: 1, notes: null,
    created_at: pastDate(3), updated_at: pastDate(3),
  },
  opponent: mockOpponentSara,
  club: null,
  eloChange: +18,
  currentElo: 1247,
  sparklineData: [1190, 1210, 1198, 1225, 1231, 1215, 1228, 1240, 1229, 1247],
};

export const MOCK_FEED_CHALLENGES: FeedChallenge[] = [
  {
    challenge: {
      id: 'mock-ch-1', sport: 'tennis', format: 'singles', status: 'proposed',
      proposed_by: 'mock-p5', proposed_times: [futureDate(2)] as unknown as Record<string, unknown>,
      confirmed_time: null, club_id: null, ladder_id: null,
      court_name: 'Court 3', location: 'City Tennis Club',
      message: 'Up for a morning match this weekend?',
      match_id: null, expires_at: futureDate(3), is_open: false,
      score_status: null,
      created_at: pastDate(1), updated_at: pastDate(1),
    },
    challenger: mockOpponentPriya,
    players: [mockOpponentPriya],
    isNew: true,
    distance: 2.1,
  },
  {
    challenge: {
      id: 'mock-ch-2', sport: 'pickleball', format: 'doubles', status: 'proposed',
      proposed_by: 'mock-p4', proposed_times: [futureDate(4)] as unknown as Record<string, unknown>,
      confirmed_time: null, club_id: null, ladder_id: null,
      court_name: null, location: 'Sports Hub NYC',
      message: null,
      match_id: null, expires_at: futureDate(5), is_open: false,
      score_status: null,
      created_at: pastDate(2), updated_at: pastDate(2),
    },
    challenger: mockOpponentJake,
    players: [mockOpponentJake],
    isNew: false,
    distance: 4.5,
  },
];

export const MOCK_FEED_OPEN_MATCHES: FeedOpenMatch[] = [
  {
    challenge: {
      id: 'mock-om-1', sport: 'tennis', format: 'singles', status: 'proposed',
      proposed_by: 'mock-p2', proposed_times: [futureDate(1)] as unknown as Record<string, unknown>,
      confirmed_time: futureDate(1), club_id: null, ladder_id: null,
      court_name: 'Court 1', location: 'City Tennis Club',
      message: 'Looking for a fun rally, all levels welcome!',
      match_id: null, expires_at: futureDate(2), is_open: true,
      score_status: null,
      created_at: pastDate(0), updated_at: pastDate(0),
    },
    host: mockOpponentAlex,
    players: [mockOpponentAlex],
    distance: 3.2,
    hostElo: 1280,
  },
  {
    challenge: {
      id: 'mock-om-2', sport: 'padel', format: 'doubles', status: 'proposed',
      proposed_by: 'mock-p1', proposed_times: [futureDate(3)] as unknown as Record<string, unknown>,
      confirmed_time: futureDate(3), club_id: null, ladder_id: null,
      court_name: null, location: 'Padel Pro Club',
      message: 'Need a 4th player for doubles!',
      match_id: null, expires_at: futureDate(4), is_open: true,
      score_status: null,
      created_at: pastDate(0), updated_at: pastDate(0),
    },
    host: mockOpponentSara,
    players: [mockOpponentSara],
    distance: 0.9,
    hostElo: 1310,
  },
];

// ─── Mock Conversations (Circles tab) ─────────────────────────────────────────

const mockParticipant = (userId: string) => ({
  id: `part-${userId}`,
  conversation_id: '',
  user_id: userId,
  last_read_at: new Date().toISOString(),
  joined_at: pastDate(30),
  is_admin: false,
  is_creator: false,
});

const mockMessage = (convId: string, senderId: string, content: string, minsAgo: number) => ({
  id: `msg-${convId}-${minsAgo}`,
  conversation_id: convId,
  sender_id: senderId,
  content,
  encrypted_content: null,
  expires_at: futureDate(30),
  created_at: new Date(Date.now() - minsAgo * 60000).toISOString(),
});

const mockConv = (id: string, type: 'direct' | 'group' | 'circle', name: string | null = null) => ({
  id,
  type: type as 'direct' | 'circle' | 'team' | 'group',
  circle_id: null,
  team_id: null,
  name,
  avatar_url: null,
  created_by: 'mock-me',
  created_at: pastDate(20),
  updated_at: new Date().toISOString(),
});

// ─── Mock Messages per conversation ──────────────────────────────────────────

export const MOCK_MESSAGES: Record<string, Array<{ id: string; conversation_id: string; sender_id: string; content: string; encrypted_content: null; expires_at: string; created_at: string }>> = {
  'conv-sara': [
    mockMessage('conv-sara', 'mock-p1', 'Hey! That was such a good match on Tuesday 🎾', 2 * 24 * 60 + 40),
    mockMessage('conv-sara', 'mock-me', 'Haha yeah I wasn\'t expecting that second set to be so close!', 2 * 24 * 60 + 35),
    mockMessage('conv-sara', 'mock-p1', 'You\'ve definitely improved your backhand since last time', 2 * 24 * 60 + 30),
    mockMessage('conv-sara', 'mock-me', 'Thanks! Been working on it a lot. Your serve is still brutal though lol', 2 * 24 * 60 + 25),
    mockMessage('conv-sara', 'mock-p1', 'Rematch soon?', 24 * 60 + 15),
    mockMessage('conv-sara', 'mock-me', 'Definitely. I\'m free next Saturday morning', 24 * 60 + 10),
    mockMessage('conv-sara', 'mock-p1', 'Great match yesterday! Rematch this weekend?', 12),
    mockMessage('conv-sara', 'mock-p1', 'City TC has courts open at 9am and 11am', 10),
  ],
  'conv-alex': [
    mockMessage('conv-alex', 'mock-me', 'Alex, you up for a match before the Brooklyn Open?', 3 * 24 * 60 + 90),
    mockMessage('conv-alex', 'mock-p2', 'For sure! Good to get some practice in', 3 * 24 * 60 + 80),
    mockMessage('conv-alex', 'mock-p2', 'How\'s your fitness level? I\'ve been training hard lately 😅', 3 * 24 * 60 + 75),
    mockMessage('conv-alex', 'mock-me', 'Ha, we\'ll find out won\'t we', 3 * 24 * 60 + 70),
    mockMessage('conv-alex', 'mock-me', 'Tomorrow 9am at City TC work for you?', 70),
    mockMessage('conv-alex', 'mock-p2', 'Perfect. See you there!', 65),
    mockMessage('conv-alex', 'mock-me', 'See you at City TC at 9am!', 60),
  ],
  'conv-priya': [
    mockMessage('conv-priya', 'mock-p5', 'Jordan! I want a rematch after last week 😤', 5 * 24 * 60 + 30),
    mockMessage('conv-priya', 'mock-me', 'Haha bring it on! I\'ve been waiting', 5 * 24 * 60 + 20),
    mockMessage('conv-priya', 'mock-p5', 'Sending you a challenge request now', 5 * 24 * 60 + 10),
    mockMessage('conv-priya', 'mock-me', 'Accepted. Saturday morning?', 5 * 24 * 60),
    mockMessage('conv-priya', 'mock-p5', 'Challenge accepted! Saturday 10am works for me.', 180),
  ],
  'conv-jake': [
    mockMessage('conv-jake', 'mock-p4', 'Yo, ever tried pickleball?', 7 * 24 * 60 + 120),
    mockMessage('conv-jake', 'mock-me', 'A few times, it\'s super fun. Way easier on the joints lol', 7 * 24 * 60 + 100),
    mockMessage('conv-jake', 'mock-p4', 'We should play! I go every Sunday', 7 * 24 * 60 + 90),
    mockMessage('conv-jake', 'mock-me', 'I\'m in. Where do you usually go?', 7 * 24 * 60 + 80),
    mockMessage('conv-jake', 'mock-p4', 'Pickleball Sunday? I know a great outdoor court.', 300),
  ],
  'conv-tennis-crew': [
    mockMessage('conv-tennis-crew', 'mock-p1', 'Has everyone registered for the Brooklyn Summer Open?', 2 * 24 * 60 + 60),
    mockMessage('conv-tennis-crew', 'mock-me', 'Not yet, when\'s the deadline?', 2 * 24 * 60 + 50),
    mockMessage('conv-tennis-crew', 'mock-p2', 'April 25th! Don\'t sleep on it', 2 * 24 * 60 + 40),
    mockMessage('conv-tennis-crew', 'mock-p1', 'We should do a warm-up match before the tournament', 2 * 24 * 60 + 30),
    mockMessage('conv-tennis-crew', 'mock-me', 'Good idea. This weekend?', 2 * 24 * 60 + 20),
    mockMessage('conv-tennis-crew', 'mock-p2', 'Who\'s in for the Brooklyn Summer Open?', 25),
  ],
  'conv-padel-squad': [
    mockMessage('conv-padel-squad', 'mock-p4', 'Padel this weekend anyone?', 3 * 24 * 60 + 100),
    mockMessage('conv-padel-squad', 'mock-me', 'I\'m in! Haven\'t played in a while', 3 * 24 * 60 + 80),
    mockMessage('conv-padel-squad', 'mock-p5', 'Same, been too busy with work 😭', 3 * 24 * 60 + 70),
    mockMessage('conv-padel-squad', 'mock-p4', 'Let me check court availability...', 3 * 24 * 60 + 60),
    mockMessage('conv-padel-squad', 'mock-p5', 'Court booked for Saturday 2pm at Padel Pro!', 90),
  ],
  'conv-city-tc': [
    mockMessage('conv-city-tc', 'club-1', 'Welcome to City Tennis Club members channel!', 30 * 24 * 60),
    mockMessage('conv-city-tc', 'club-1', 'Reminder: Summer season memberships are now open for renewal.', 10 * 24 * 60),
    mockMessage('conv-city-tc', 'club-1', 'Brooklyn Summer Open 2026 registrations are live. Sign up via the app.', 5 * 24 * 60),
    mockMessage('conv-city-tc', 'club-1', '4 new clay courts are now open. Book via the app!', 240),
  ],
};

export const MOCK_CONVERSATIONS: ConversationItem[] = [
  // ── DMs ──
  {
    conversation: mockConv('conv-sara', 'direct'),
    otherParticipants: [{ participant: { ...mockParticipant('mock-p1'), conversation_id: 'conv-sara' }, profile: mockOpponentSara }],
    myParticipant: { ...mockParticipant('mock-me'), conversation_id: 'conv-sara' },
    lastMessage: mockMessage('conv-sara', 'mock-p1', 'Great match yesterday! Rematch this weekend?', 12),
    unreadCount: 2,
    displayName: 'Sara Johnson',
    displayAvatarUrl: null,
    isOnline: true,
    lastActivity: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    conversation: mockConv('conv-alex', 'direct'),
    otherParticipants: [{ participant: { ...mockParticipant('mock-p2'), conversation_id: 'conv-alex' }, profile: mockOpponentAlex }],
    myParticipant: { ...mockParticipant('mock-me'), conversation_id: 'conv-alex' },
    lastMessage: mockMessage('conv-alex', 'mock-me', 'See you at City TC at 9am!', 60),
    unreadCount: 0,
    displayName: 'Alex Chen',
    displayAvatarUrl: null,
    isOnline: false,
    lastActivity: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    conversation: mockConv('conv-priya', 'direct'),
    otherParticipants: [{ participant: { ...mockParticipant('mock-p5'), conversation_id: 'conv-priya' }, profile: mockOpponentPriya }],
    myParticipant: { ...mockParticipant('mock-me'), conversation_id: 'conv-priya' },
    lastMessage: mockMessage('conv-priya', 'mock-p5', 'Challenge accepted! Saturday 10am works for me.', 180),
    unreadCount: 1,
    displayName: 'Priya Patel',
    displayAvatarUrl: null,
    isOnline: true,
    lastActivity: new Date(Date.now() - 180 * 60000).toISOString(),
  },
  {
    conversation: mockConv('conv-jake', 'direct'),
    otherParticipants: [{ participant: { ...mockParticipant('mock-p4'), conversation_id: 'conv-jake' }, profile: mockOpponentJake }],
    myParticipant: { ...mockParticipant('mock-me'), conversation_id: 'conv-jake' },
    lastMessage: mockMessage('conv-jake', 'mock-p4', 'Pickleball Sunday? I know a great outdoor court.', 300),
    unreadCount: 0,
    displayName: 'Jake Williams',
    displayAvatarUrl: null,
    isOnline: false,
    lastActivity: new Date(Date.now() - 300 * 60000).toISOString(),
  },
  // ── Groups ──
  {
    conversation: { ...mockConv('conv-tennis-crew', 'group', 'Tennis Crew'), type: 'group' },
    otherParticipants: [
      { participant: { ...mockParticipant('mock-p1'), conversation_id: 'conv-tennis-crew' }, profile: mockOpponentSara },
      { participant: { ...mockParticipant('mock-p2'), conversation_id: 'conv-tennis-crew' }, profile: mockOpponentAlex },
    ],
    myParticipant: { ...mockParticipant('mock-me'), conversation_id: 'conv-tennis-crew' },
    lastMessage: mockMessage('conv-tennis-crew', 'mock-p2', 'Who\'s in for the Brooklyn Summer Open?', 25),
    unreadCount: 4,
    displayName: 'Tennis Crew',
    displayAvatarUrl: null,
    isOnline: false,
    lastActivity: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    conversation: { ...mockConv('conv-padel-squad', 'group', 'Padel Squad'), type: 'group' },
    otherParticipants: [
      { participant: { ...mockParticipant('mock-p5'), conversation_id: 'conv-padel-squad' }, profile: mockOpponentPriya },
      { participant: { ...mockParticipant('mock-p4'), conversation_id: 'conv-padel-squad' }, profile: mockOpponentJake },
    ],
    myParticipant: { ...mockParticipant('mock-me'), conversation_id: 'conv-padel-squad' },
    lastMessage: mockMessage('conv-padel-squad', 'mock-p5', 'Court booked for Saturday 2pm at Padel Pro!', 90),
    unreadCount: 0,
    displayName: 'Padel Squad',
    displayAvatarUrl: null,
    isOnline: false,
    lastActivity: new Date(Date.now() - 90 * 60000).toISOString(),
  },
  // ── Broadcast / Circle ──
  {
    conversation: { ...mockConv('conv-city-tc', 'circle', 'City Tennis Club'), type: 'circle' },
    otherParticipants: [],
    myParticipant: { ...mockParticipant('mock-me'), conversation_id: 'conv-city-tc' },
    lastMessage: mockMessage('conv-city-tc', 'club-1', '4 new clay courts are now open. Book via the app!', 240),
    unreadCount: 1,
    displayName: 'City Tennis Club',
    displayAvatarUrl: null,
    isOnline: false,
    lastActivity: new Date(Date.now() - 240 * 60000).toISOString(),
  },
];
