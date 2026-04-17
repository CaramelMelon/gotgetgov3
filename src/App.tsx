import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { GuestTutorialProvider } from './contexts/GuestTutorialContext';
import { TutorialSpotlight } from './components/tutorial/TutorialSpotlight';
import { FilterProvider } from './contexts/FilterContext';
import { FullscreenProvider } from './contexts/FullscreenContext';
import { MockModeProvider, IS_MOCK } from './contexts/MockModeContext';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { PublicRoute } from './components/routing/PublicRoute';
import { GuestRoute } from './components/routing/GuestRoute';

// Auth
import { LandingPage } from './pages/auth/LandingPage';
import { AuthCallback } from './pages/auth/AuthCallback';

// Onboarding
import { OnboardingPage } from './pages/onboarding/OnboardingPage';

// Main pages
import { DiscoverPage } from './pages/discover/DiscoverPage';
import { NewsPage } from './pages/news/NewsPage';
import { SchedulePage } from './pages/schedule/SchedulePage';
import { ChallengesPage } from './pages/challenges';
import { ResultsPage } from './pages/results/ResultsPage';
import { CirclesPage } from './pages/circles/CirclesPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { MySportsPage } from './pages/sports/MySportsPage';

// Create flows
import {
  CreateMatchPage,
  CreateEventPage,
  CreateCompetitionPage,
  CreateCirclePage,
  CreateAnnouncementPage,
  EditCirclePage,
} from './pages/create';

function MockEntry() {
  useEffect(() => {
    sessionStorage.setItem('gg-mock', 'true');
    window.location.replace('/discover');
  }, []);
  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--color-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--color-acc)', borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}


function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/auth" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Onboarding */}
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

      {/* Main tabs (GuestRoute = accessible when auth OR guest) */}
      <Route path="/discover" element={<GuestRoute><AppShell><DiscoverPage /></AppShell></GuestRoute>} />
      <Route path="/news"     element={<GuestRoute><AppShell><NewsPage /></AppShell></GuestRoute>} />
      <Route path="/schedule" element={<GuestRoute><AppShell><SchedulePage /></AppShell></GuestRoute>} />
      <Route path="/challenges" element={<GuestRoute><AppShell><ChallengesPage /></AppShell></GuestRoute>} />
      <Route path="/results"  element={<GuestRoute><AppShell><ResultsPage /></AppShell></GuestRoute>} />
      <Route path="/circles"  element={<GuestRoute><AppShell><CirclesPage /></AppShell></GuestRoute>} />
      <Route path="/profile"  element={<GuestRoute><AppShell><ProfilePage /></AppShell></GuestRoute>} />
      <Route path="/notifications" element={<GuestRoute><AppShell><NotificationsPage /></AppShell></GuestRoute>} />
      <Route path="/settings" element={<GuestRoute><AppShell><SettingsPage /></AppShell></GuestRoute>} />

      {/* Protected routes */}
      <Route path="/sports"              element={<ProtectedRoute><MySportsPage /></ProtectedRoute>} />
      <Route path="/match/new"           element={<ProtectedRoute><CreateMatchPage /></ProtectedRoute>} />
      <Route path="/event/new"           element={<ProtectedRoute><CreateEventPage /></ProtectedRoute>} />
      <Route path="/competition/new"     element={<ProtectedRoute><CreateCompetitionPage /></ProtectedRoute>} />
      <Route path="/circle/new"          element={<ProtectedRoute><CreateCirclePage /></ProtectedRoute>} />
      <Route path="/announcement/new"    element={<ProtectedRoute><CreateAnnouncementPage /></ProtectedRoute>} />
      <Route path="/:type/:id/edit"      element={<ProtectedRoute><EditCirclePage /></ProtectedRoute>} />

      {/* Mock demo entry — sets flag then reloads to /discover */}
      <Route path="/mock" element={<MockEntry />} />

      {/* Fallbacks */}
      <Route path="/" element={<Navigate to="/discover" replace />} />
      <Route path="*" element={<Navigate to="/discover" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <MockModeProvider>
          <AuthProvider>
            <GuestTutorialProvider>
              <FilterProvider>
                <FullscreenProvider>
                  <AppRoutes />
                  <TutorialSpotlight />
                </FullscreenProvider>
              </FilterProvider>
            </GuestTutorialProvider>
          </AuthProvider>
        </MockModeProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
