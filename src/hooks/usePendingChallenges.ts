import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to fetch the count of pending challenges for the current user
 * @returns Object containing count and loading state
 */
export function usePendingChallenges() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    const fetchCount = async () => {
      setLoading(true);
      try {
        const { count: pendingCount, error } = await supabase
          .from('challenge_players')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('response', 'pending');

        if (error) throw error;
        setCount(pendingCount || 0);
      } catch (error) {
        console.error('Error fetching pending challenges count:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();

    // Set up real-time subscription for challenge_players changes
    const channel = supabase
      .channel('pending-challenges-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenge_players',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch count when challenge_players table changes
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { count, loading };
}
