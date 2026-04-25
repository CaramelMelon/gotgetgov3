import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMockMode } from '../../contexts/MockModeContext';

interface GuestRouteProps {
  children: React.ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { user, loading, profile } = useAuth();
  const isMockMode = useMockMode();

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--color-acc)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!user && !isMockMode) return <Navigate to="/auth" replace />;

  if (user && !profile?.onboarding_completed) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}
