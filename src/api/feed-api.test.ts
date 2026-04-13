/**
 * Tests for feed-api.ts
 * Focus on fetchOpenAcceptedMatches function
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchOpenAcceptedMatches } from './feed-api';
import { supabase } from '@/lib/supabase';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock the calculateDistance utility
vi.mock('@/lib/feed-utils', () => ({
  calculateDistance: vi.fn((lat1, lng1, lat2, lng2) => {
    // Simple mock distance calculation
    return Math.abs(lat1 - lat2) + Math.abs(lng1 - lng2);
  }),
}));

describe('fetchOpenAcceptedMatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return only challenges where is_open = true AND status = accepted', async () => {
    const mockUserId = 'user-123';
    const mockChallenges = [
      {
        id: 'challenge-1',
        sport: 'tennis',
        format: 'singles',
        status: 'accepted',
        is_open: true,
        confirmed_time: '2024-01-15T10:00:00Z',
        proposer: {
          id: 'proposer-1',
          full_name: 'John Doe',
          avatar_url: null,
        },
        club: {
          id: 'club-1',
          name: 'Test Club',
          location_lat: 40.7128,
          location_lng: -74.0060,
        },
        challenge_players: [
          {
            user_id: 'player-1',
            response: 'accepted',
            profiles: {
              id: 'player-1',
              full_name: 'Player One',
              avatar_url: null,
            },
          },
        ],
      },
    ];

    const mockUserProfile = {
      location_lat: 40.7580,
      location_lng: -73.9855,
    };

    // Mock the Supabase query chain
    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockReturnThis();
    const limitMock = vi.fn().mockResolvedValue({ data: mockChallenges });
    const singleMock = vi.fn().mockResolvedValue({ data: mockUserProfile });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'challenges') {
        return {
          select: selectMock,
          eq: eqMock,
          order: orderMock,
          limit: limitMock,
        } as any;
      } else if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: singleMock,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const result = await fetchOpenAcceptedMatches(mockUserId);

    // Verify the query was called with correct filters
    expect(supabase.from).toHaveBeenCalledWith('challenges');
    expect(eqMock).toHaveBeenCalledWith('is_open', true);
    expect(eqMock).toHaveBeenCalledWith('status', 'accepted');
    expect(orderMock).toHaveBeenCalledWith('confirmed_time', { ascending: true });
    expect(limitMock).toHaveBeenCalledWith(10);

    // Verify the result structure
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('challenge');
    expect(result[0]).toHaveProperty('host');
    expect(result[0]).toHaveProperty('players');
    expect(result[0]).toHaveProperty('distance');
    expect(result[0].challenge.status).toBe('accepted');
    expect(result[0].challenge.is_open).toBe(true);
    expect(result[0].players).toHaveLength(1);
  });

  it('should return empty array when no open accepted matches exist', async () => {
    const mockUserId = 'user-123';

    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockReturnThis();
    const limitMock = vi.fn().mockResolvedValue({ data: null });

    vi.mocked(supabase.from).mockReturnValue({
      select: selectMock,
      eq: eqMock,
      order: orderMock,
      limit: limitMock,
    } as any);

    const result = await fetchOpenAcceptedMatches(mockUserId);

    expect(result).toEqual([]);
  });

  it('should include proposer profile, club data, and player list', async () => {
    const mockUserId = 'user-123';
    const mockChallenges = [
      {
        id: 'challenge-1',
        sport: 'tennis',
        format: 'singles',
        status: 'accepted',
        is_open: true,
        confirmed_time: '2024-01-15T10:00:00Z',
        proposer: {
          id: 'proposer-1',
          full_name: 'John Doe',
          email: 'john@example.com',
        },
        club: {
          id: 'club-1',
          name: 'Test Club',
          city: 'New York',
          location_lat: 40.7128,
          location_lng: -74.0060,
        },
        challenge_players: [
          {
            user_id: 'player-1',
            response: 'accepted',
            profiles: {
              id: 'player-1',
              full_name: 'Player One',
            },
          },
          {
            user_id: 'player-2',
            response: 'accepted',
            profiles: {
              id: 'player-2',
              full_name: 'Player Two',
            },
          },
        ],
      },
    ];

    const mockUserProfile = {
      location_lat: 40.7580,
      location_lng: -73.9855,
    };

    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockReturnThis();
    const limitMock = vi.fn().mockResolvedValue({ data: mockChallenges });
    const singleMock = vi.fn().mockResolvedValue({ data: mockUserProfile });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'challenges') {
        return {
          select: selectMock,
          eq: eqMock,
          order: orderMock,
          limit: limitMock,
        } as any;
      } else if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: singleMock,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const result = await fetchOpenAcceptedMatches(mockUserId);

    expect(result[0].host).toEqual(mockChallenges[0].proposer);
    expect(result[0].players).toHaveLength(2);
    expect(result[0].players[0].full_name).toBe('Player One');
    expect(result[0].players[1].full_name).toBe('Player Two');
  });

  it('should calculate distance from user location', async () => {
    const mockUserId = 'user-123';
    const mockChallenges = [
      {
        id: 'challenge-1',
        sport: 'tennis',
        format: 'singles',
        status: 'accepted',
        is_open: true,
        confirmed_time: '2024-01-15T10:00:00Z',
        proposer: {
          id: 'proposer-1',
          full_name: 'John Doe',
        },
        club: {
          id: 'club-1',
          name: 'Test Club',
          location_lat: 40.7128,
          location_lng: -74.0060,
        },
        challenge_players: [],
      },
    ];

    const mockUserProfile = {
      location_lat: 40.7580,
      location_lng: -73.9855,
    };

    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockReturnThis();
    const limitMock = vi.fn().mockResolvedValue({ data: mockChallenges });
    const singleMock = vi.fn().mockResolvedValue({ data: mockUserProfile });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'challenges') {
        return {
          select: selectMock,
          eq: eqMock,
          order: orderMock,
          limit: limitMock,
        } as any;
      } else if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: singleMock,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const result = await fetchOpenAcceptedMatches(mockUserId);

    expect(result[0].distance).toBeGreaterThan(0);
  });

  it('should handle missing user profile gracefully', async () => {
    const mockUserId = 'user-123';
    const mockChallenges = [
      {
        id: 'challenge-1',
        sport: 'tennis',
        format: 'singles',
        status: 'accepted',
        is_open: true,
        confirmed_time: '2024-01-15T10:00:00Z',
        proposer: {
          id: 'proposer-1',
          full_name: 'John Doe',
        },
        club: {
          id: 'club-1',
          name: 'Test Club',
          location_lat: 40.7128,
          location_lng: -74.0060,
        },
        challenge_players: [],
      },
    ];

    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockReturnThis();
    const limitMock = vi.fn().mockResolvedValue({ data: mockChallenges });
    const singleMock = vi.fn().mockResolvedValue({ data: null });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'challenges') {
        return {
          select: selectMock,
          eq: eqMock,
          order: orderMock,
          limit: limitMock,
        } as any;
      } else if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: singleMock,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const result = await fetchOpenAcceptedMatches(mockUserId);

    expect(result[0].distance).toBe(0);
  });

  it('should handle missing club data gracefully', async () => {
    const mockUserId = 'user-123';
    const mockChallenges = [
      {
        id: 'challenge-1',
        sport: 'tennis',
        format: 'singles',
        status: 'accepted',
        is_open: true,
        confirmed_time: '2024-01-15T10:00:00Z',
        proposer: {
          id: 'proposer-1',
          full_name: 'John Doe',
        },
        club: null,
        challenge_players: [],
      },
    ];

    const mockUserProfile = {
      location_lat: 40.7580,
      location_lng: -73.9855,
    };

    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockReturnThis();
    const limitMock = vi.fn().mockResolvedValue({ data: mockChallenges });
    const singleMock = vi.fn().mockResolvedValue({ data: mockUserProfile });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'challenges') {
        return {
          select: selectMock,
          eq: eqMock,
          order: orderMock,
          limit: limitMock,
        } as any;
      } else if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: singleMock,
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const result = await fetchOpenAcceptedMatches(mockUserId);

    expect(result[0].distance).toBe(0);
  });
});
