/**
 * Mock Data for the application.
 *
 * ALL mock/sample data is centralized here. To remove all mock data
 * from the application, simply empty every array below (set to []).
 * The app will then only show real data from Supabase.
 */

// ─── News Feed ──────────────────────────────────────────────────────
export const sampleFeed = [];

// ─── Results Page: Match History ────────────────────────────────────
export const sampleMatches = [];

// ─── Results Page: Ladder Standings ─────────────────────────────────
export const sampleLadderStandings = [];

// ─── Results Page: League Standings ─────────────────────────────────
export const sampleLeagueStandings = [];

// ─── Results Page: Tournament Results ───────────────────────────────
export const sampleTournaments = [];

// ─── Schedule Page ──────────────────────────────────────────────────
export const sampleSchedule = [];

// ─── Circles Page: Match Requests ───────────────────────────────────
export const sampleMatchRequests = [];

// ─── Discover Page: Fallback Competitions ───────────────────────────
export const fallbackCompetitions = [];

// ─── Discover Page: Fallback Events ─────────────────────────────────
export const fallbackEvents = [];

// ─── Results Page: Stats Overview ───────────────────────────────────
export const sampleStats = {
  matchesPlayed: 0,
  wins: 0,
  winRate: '0%',
};

// ─── Stories: Sample Players Who Have Stories ────────────────────────
// These are the "connection" players who have active stories (mock data).
// The IDs here are used as keys in sampleStoriesByPlayer below.
export const sampleStoryPlayers = [];

// ─── Stories: Sample Stories By Player ──────────────────────────────
export const sampleStoriesByPlayer: Record<string, Array<{
  id: string;
  type: 'image' | 'match_result' | 'text';
  content: string;
  timestamp: string;
  meta?: any;
}>> = {};

// ─── Discovery Mode: Profile Details ────────────────────────────────
export interface ProfilePhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  uploadedAt: Date;
}

export interface ProfileDetails {
  userId: string;
  bio: string;
  interests: string[];
  genderPreference?: string;
  occupation?: string;
  education?: string;
  pets?: string;
  hobbies?: string[];
  drinkingPreference: string;
  smokingPreference: string;
  archivePhotos: ProfilePhoto[];
}

export const sampleProfileDetails: Record<string, ProfileDetails> = {};

// ─── Discovery Mode: Discover Players (Card Stack) ──────────────────
export interface DiscoverPlayer {
  id: string;
  fullName: string;
  age: number;
  location: string;
  distance: string;
  sport: string;
  skillLevel: string;
  avatarUrl: string;
  profileImageUrl: string;
  availability: string;
  matchPercentage?: number;
}

export const sampleDiscoverPlayers: DiscoverPlayer[] = [];

// ─── Discovery Mode: Analytics Events ───────────────────────────────
export interface DiscoveryModeAnalyticsEvent {
  id: string;
  eventType: 'discovery_mode_activation' | 'discovery_mode_exit' | 'profile_details_scroll' | 'discovery_mode_interaction' | 'discovery_mode_error';
  userId: string;
  profileId: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
}

export const sampleDiscoveryModeAnalytics: DiscoveryModeAnalyticsEvent[] = [];
