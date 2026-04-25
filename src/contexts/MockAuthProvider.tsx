import { type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { MOCK_AUTH_USER, MOCK_AUTH_PROFILE } from '../data/mockDemoData';

/** Wraps /mock/* routes — provides mock user/profile without touching real Supabase auth. */
export function MockAuthProvider({ children }: { children: ReactNode }) {
  const value = {
    user: MOCK_AUTH_USER,
    profile: MOCK_AUTH_PROFILE,
    session: null,
    loading: false,
    signUp: async () => ({ error: null }),
    signIn: async () => ({ error: null }),
    signInWithGoogle: async () => ({ error: null }),
    signOut: async () => {},
    updateProfile: async () => ({ error: null }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
