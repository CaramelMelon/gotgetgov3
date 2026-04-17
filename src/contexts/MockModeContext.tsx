import { createContext, useContext, type ReactNode } from 'react';

export const IS_MOCK = sessionStorage.getItem('gg-mock') === 'true';

const MockModeContext = createContext(IS_MOCK);

export function MockModeProvider({ children }: { children: ReactNode }) {
  return <MockModeContext.Provider value={IS_MOCK}>{children}</MockModeContext.Provider>;
}

export function useMockMode() {
  return useContext(MockModeContext);
}
