import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { ChallengeCard } from '@/components/feed/ChallengeCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getOrCreateDirectConversation } from '@/lib/messaging';
import type { FeedChallenge } from '@/types/feed';
import type { Challenge, Profile } from '@/types/database';
import { CalendarDays } from 'lucide-react';

interface ChallengeWithDetails {
  challenge_id: string;
  response: string;
  challenges: Challenge & {
    profiles?: Profile;
  };
}

export function ChallengesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<FeedChallenge[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingChallenges = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('challenge_players')
        .select(`
          challenge_id,
          response,
          challenges (
            id,
            sport,
            format,
            location,
            proposed_times,
            status,
            proposed_by,
            is_open,
            message,
            created_at,
            confirmed_time,
            club_id,
            clubs (name),
            profiles!challenges_proposed_by_fkey (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('response', 'pending')
        .in('challenges.status', ['proposed']);

      if (error) throw error;

      // Process and transform data to FeedChallenge format
      const processedChallenges: FeedChallenge[] = [];
      
      if (data) {
        (data as any[]).forEach((item) => {
          const challenge = item.challenges;
          if (!challenge) return;

          const proposer = challenge.profiles;
          if (!proposer) return;

          // Check if challenge is new (created within last 24 hours)
          const createdAt = new Date(challenge.created_at);
          const now = new Date();
          const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          const isNew = hoursSinceCreation < 24;

          processedChallenges.push({
            challenge: challenge as Challenge,
            challenger: proposer as Profile,
            players: [], // Not needed for challenges page
            isNew,
            distance: 0, // Not needed for challenges page
          });
        });
      }

      setChallenges(processedChallenges);
    } catch (error) {
      console.error('Error fetching pending challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (challengeId: string, proposerId: string) => {
    if (!user) return;

    try {
      // Get or create conversation with proposer
      const result = await getOrCreateDirectConversation(user.id, proposerId);
      
      if (result.conversationId) {
        // Navigate to the conversation
        navigate(`/circles?conversation=${result.conversationId}`);
      } else if (result.error) {
        console.error('Error opening conversation:', result.error);
        // Could show a toast notification here
      }
    } catch (error) {
      console.error('Error opening conversation:', error);
    }
  };

  useEffect(() => {
    fetchPendingChallenges();
  }, [user]);

  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto', 
      background: 'var(--color-bg)', 
      paddingBottom: 'var(--page-pb)' as any 
    }}>
      <PageContainer>
        {/* Header */}
        <div style={{ 
          padding: 'var(--space-5) var(--space-5) var(--space-3)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', 
              fontSize: 'var(--text-2xl)',
              fontWeight: 800, 
              color: 'var(--color-t1)', 
              letterSpacing: '-0.02em', 
              lineHeight: 1.15,
              margin: 0,
            }}>
              Match Proposals
            </h1>
            <p style={{ 
              fontFamily: 'var(--font-body)', 
              fontSize: 'var(--text-sm)', 
              color: 'var(--color-t2)', 
              marginTop: 4,
              marginBottom: 0,
            }}>
              Respond to incoming challenges
            </p>
          </div>

          {challenges.length > 0 && (
            <span style={{
              fontFamily: 'var(--font-body)', 
              fontSize: 10, 
              fontWeight: 700,
              background: 'var(--color-acc-bg)', 
              color: 'var(--color-acc)',
              padding: '2px 10px', 
              borderRadius: 'var(--radius-full)',
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              border: '1px solid color-mix(in srgb, var(--color-acc) 25%, transparent)',
            }}>
              {challenges.length} Pending
            </span>
          )}
        </div>

        {/* Challenges List */}
        <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '48px 0' 
            }}>
              <div style={{
                width: 28, 
                height: 28, 
                borderRadius: '50%',
                border: '2px solid var(--color-acc)', 
                borderTopColor: 'transparent',
                animation: 'spin 0.7s linear infinite',
              }} />
            </div>
          ) : challenges.length === 0 ? (
            // Empty state
            <div style={{
              textAlign: 'center', 
              padding: '48px 0',
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 'var(--space-3)',
            }}>
              <CalendarDays size={48} style={{ color: 'var(--color-t3)' }} />
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  color: 'var(--color-t1)',
                  margin: '0 0 8px 0',
                }}>
                  No pending challenges
                </h3>
                <p style={{ 
                  fontFamily: 'var(--font-body)', 
                  fontSize: 'var(--text-sm)', 
                  color: 'var(--color-t3)',
                  margin: 0,
                }}>
                  When someone challenges you to a match, it will appear here
                </p>
              </div>
            </div>
          ) : (
            // Challenges list
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.challenge.id}
                  challenge={challenge}
                  onRespondClick={() => handleRespond(
                    challenge.challenge.id, 
                    challenge.challenger.id
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Visibility Badge Info (if challenges exist) */}
        {challenges.length > 0 && (
          <div style={{ 
            padding: '0 var(--space-5) var(--space-4)',
            marginTop: 'var(--space-4)',
          }}>
            <div style={{
              background: 'var(--color-surf)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-4)',
              border: '1px solid var(--color-bdr)',
            }}>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-t2)',
                margin: 0,
                lineHeight: 1.5,
              }}>
                <strong style={{ color: 'var(--color-t1)' }}>Tip:</strong> Click "Respond" to open a conversation with the challenger. 
                You can accept or decline the match through the chat.
              </p>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
