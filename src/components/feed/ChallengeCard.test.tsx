import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChallengeCard } from './ChallengeCard';
import type { FeedChallenge } from '@/types/feed';

describe('ChallengeCard', () => {
  const mockChallenge: FeedChallenge = {
    challenge: {
      id: 'test-challenge-1',
      sport: 'tennis',
      format: 'singles',
      status: 'proposed',
      score_status: null,
      proposed_by: 'user-1',
      proposed_times: null,
      confirmed_time: null, // No confirmed time yet - it's a pending challenge
      club_id: 'club-1',
      ladder_id: null,
      court_name: null,
      location: 'Central Park Tennis Courts',
      message: 'Looking forward to playing with you!',
      match_id: null,
      expires_at: null,
      is_open: true,
      created_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow - not expired
      updated_at: new Date().toISOString(),
    },
    challenger: {
      id: 'user-1',
      email: 'john@example.com',
      full_name: 'John Doe',
      avatar_url: null,
      bio: '',
      phone: null,
      location_lat: null,
      location_lng: null,
      location_city: null,
      location_country: null,
      home_club_id: null,
      onboarding_completed: true,
      dark_mode: false,
      push_notifications: true,
      email_notifications: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_seen: null,
    },
    players: [],
    isNew: true,
    distance: 0,
  };

  it('renders challenge card with all details', () => {
    const onRespondClick = vi.fn();
    render(<ChallengeCard challenge={mockChallenge} onRespondClick={onRespondClick} />);

    // Check challenger name
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Check sport
    expect(screen.getByText('Tennis')).toBeInTheDocument();

    // Check location
    expect(screen.getByText('Central Park Tennis Courts')).toBeInTheDocument();

    // Check message
    expect(screen.getByText('Looking forward to playing with you!')).toBeInTheDocument();

    // Check visibility badge
    expect(screen.getByText('Open')).toBeInTheDocument();

    // Check respond button
    expect(screen.getByRole('button', { name: /respond/i })).toBeInTheDocument();
  });

  it('displays "Private" badge when is_open is false', () => {
    const privateChallenge: FeedChallenge = {
      ...mockChallenge,
      challenge: {
        ...mockChallenge.challenge,
        is_open: false,
      },
    };

    render(<ChallengeCard challenge={privateChallenge} onRespondClick={vi.fn()} />);
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('displays "Open" badge when is_open is true', () => {
    render(<ChallengeCard challenge={mockChallenge} onRespondClick={vi.fn()} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('does not display location when not provided', () => {
    const challengeWithoutLocation: FeedChallenge = {
      ...mockChallenge,
      challenge: {
        ...mockChallenge.challenge,
        location: null,
      },
    };

    render(<ChallengeCard challenge={challengeWithoutLocation} onRespondClick={vi.fn()} />);
    expect(screen.queryByText('Central Park Tennis Courts')).not.toBeInTheDocument();
  });

  it('does not display message when not provided', () => {
    const challengeWithoutMessage: FeedChallenge = {
      ...mockChallenge,
      challenge: {
        ...mockChallenge.challenge,
        message: null,
      },
    };

    render(<ChallengeCard challenge={challengeWithoutMessage} onRespondClick={vi.fn()} />);
    expect(screen.queryByText('Looking forward to playing with you!')).not.toBeInTheDocument();
  });

  it('calls onRespondClick when respond button is clicked', () => {
    const onRespondClick = vi.fn();
    render(<ChallengeCard challenge={mockChallenge} onRespondClick={onRespondClick} />);

    const respondButton = screen.getByRole('button', { name: /respond/i });
    fireEvent.click(respondButton);

    expect(onRespondClick).toHaveBeenCalledTimes(1);
  });

  it('displays "New" badge when isNew is true', () => {
    render(<ChallengeCard challenge={mockChallenge} onRespondClick={vi.fn()} />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('does not display "New" badge when isNew is false', () => {
    const oldChallenge: FeedChallenge = {
      ...mockChallenge,
      isNew: false,
    };

    render(<ChallengeCard challenge={oldChallenge} onRespondClick={vi.fn()} />);
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });
});
