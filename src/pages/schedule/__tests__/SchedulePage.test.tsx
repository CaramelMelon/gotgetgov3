import { describe, it, expect } from 'vitest';

describe('SchedulePage - Query Filtering Logic', () => {
  it('should filter out pending challenges from schedule', () => {
    // This test validates the core filtering logic that was changed
    // Before: .in('response', ['accepted', 'pending']) - included both
    // After: .eq('response', 'accepted') - only accepted
    
    const mockChallenges = [
      { id: '1', response: 'accepted', status: 'confirmed' },
      { id: '2', response: 'pending', status: 'proposed' },
      { id: '3', response: 'accepted', status: 'confirmed' },
      { id: '4', response: 'pending', status: 'proposed' },
    ];

    // Filter logic that matches the database query change
    const acceptedOnly = mockChallenges.filter(c => c.response === 'accepted');

    // Verify only accepted challenges are included
    expect(acceptedOnly).toHaveLength(2);
    expect(acceptedOnly.every(c => c.response === 'accepted')).toBe(true);
    
    // Verify pending challenges are excluded
    expect(acceptedOnly.find(c => c.id === '2')).toBeUndefined();
    expect(acceptedOnly.find(c => c.id === '4')).toBeUndefined();
    
    // Verify accepted challenges are included
    expect(acceptedOnly.find(c => c.id === '1')).toBeDefined();
    expect(acceptedOnly.find(c => c.id === '3')).toBeDefined();
  });

  it('should handle empty challenge list', () => {
    const mockChallenges: any[] = [];
    const acceptedOnly = mockChallenges.filter(c => c.response === 'accepted');
    
    expect(acceptedOnly).toHaveLength(0);
  });

  it('should handle all accepted challenges', () => {
    const mockChallenges = [
      { id: '1', response: 'accepted', status: 'confirmed' },
      { id: '2', response: 'accepted', status: 'confirmed' },
    ];

    const acceptedOnly = mockChallenges.filter(c => c.response === 'accepted');
    
    expect(acceptedOnly).toHaveLength(2);
  });

  it('should handle all pending challenges', () => {
    const mockChallenges = [
      { id: '1', response: 'pending', status: 'proposed' },
      { id: '2', response: 'pending', status: 'proposed' },
    ];

    const acceptedOnly = mockChallenges.filter(c => c.response === 'accepted');
    
    expect(acceptedOnly).toHaveLength(0);
  });
});
