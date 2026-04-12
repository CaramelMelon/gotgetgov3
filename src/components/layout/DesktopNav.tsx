import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, Newspaper, Calendar, Users, Swords } from 'lucide-react';
import { NotificationBadge } from '../ui/NotificationBadge';
import { TABS, type TabId } from '../../types';

interface DesktopNavProps {
  unreadMessages?: number;
}

// Desktop-only tab that maps to /circles?view=matches — separate from the Circles tab
const PLAY_TAB = {
  id: 'play' as const,
  label: 'Play',
  path: '/circles',
  viewParam: 'matches',
  icon: Swords,
} as const;

const tabIcons: Record<TabId, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  discover: Compass,
  news: Newspaper,
  schedule: Calendar,
  circles: Users,
};

// For Circles tab on desktop, force ?view=circles so it lands on messaging/groups
const CIRCLES_DESKTOP_PARAM = 'circles';

type NavItem = {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  viewParam?: string;
  showBadge?: boolean;
};

export function DesktopNav({ unreadMessages = 0 }: DesktopNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParam = new URLSearchParams(location.search).get('view');

  // Determine which desktop tab is active
  const getActiveId = () => {
    const pathname = location.pathname;
    if (pathname.startsWith('/circles')) {
      // Play = matches view (default) | Circles = circles view
      return searchParam === 'circles' ? 'circles' : 'play';
    }
    return TABS.find((tab) => pathname.startsWith(tab.path))?.id || 'discover';
  };
  const activeId = getActiveId();

  // Build the desktop nav items: Discover · News · Schedule · Play · Circles
  const items: NavItem[] = [
    { id: 'discover', label: 'Discover', path: '/discover', icon: Compass },
    { id: 'news',     label: 'News',     path: '/news',     icon: Newspaper },
    { id: 'schedule', label: 'Schedule', path: '/schedule', icon: Calendar },
    { id: 'play',     label: 'Matches',  path: '/circles?view=matches', icon: Swords },
    {
      id: 'circles',
      label: 'Circles',
      path: `/circles?view=${CIRCLES_DESKTOP_PARAM}`,
      icon: Users,
      showBadge: unreadMessages > 0,
    },
  ];

  return (
    <nav
      className="hidden lg:flex items-center"
      style={{ gap: 2 }}
      role="navigation"
      aria-label="Main navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;

        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 34, padding: '0 12px',
              borderRadius: 8,
              border: 'none', cursor: 'pointer',
              background: isActive ? 'var(--color-surf)' : 'transparent',
              color: isActive ? 'var(--color-t1)' : 'var(--color-t2)',
              fontFamily: 'var(--font-body)',
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              transition: 'background 0.15s, color 0.15s',
              boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surf-2)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-t1)';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-t2)';
              }
            }}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div style={{ position: 'relative', width: 16, height: 16, flexShrink: 0 }}>
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              {item.showBadge && <NotificationBadge count={unreadMessages} />}
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
