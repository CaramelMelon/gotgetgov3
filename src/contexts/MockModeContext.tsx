import { createContext, useContext, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export function safeSessionGet(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return null; }
}
export function safeSessionSet(key: string, value: string): void {
  try { sessionStorage.setItem(key, value); } catch { /* ignore */ }
}
export function safeSessionRemove(key: string): void {
  try { sessionStorage.removeItem(key); } catch { /* ignore */ }
}

/** Returns true when the current URL is under /mock/* */
export function isMockPath(pathname: string) {
  return pathname.startsWith('/mock/') || pathname === '/mock';
}

// Legacy constant — kept for AuthContext which can't use hooks at module level.
// AuthContext now uses isMockPath(window.location.pathname) instead.
export const IS_MOCK = isMockPath(window.location.pathname);

const MockModeContext = createContext(false);

export function MockModeProvider({ children }: { children: ReactNode }) {
  return <MockModeContext.Provider value={false}>{children}</MockModeContext.Provider>;
}

/** Hook — reads from the live URL so it's always accurate. */
export function useMockMode() {
  const { pathname } = useLocation();
  return isMockPath(pathname);
}
