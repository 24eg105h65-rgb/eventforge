import { ArrowUpRight, CalendarDays, LayoutDashboard, ListChecks, LogOut, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navigationByRole = {
  organizer: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'My Events', to: '/my-events', icon: CalendarDays },
    { label: 'Create Event', to: '/events/new', icon: CalendarDays },
    { label: 'Profile', to: '/dashboard/profile', icon: UserRound },
  ],
  attendee: [
    { label: 'Browse Events', to: '/events', icon: CalendarDays },
    { label: 'My Registrations', to: '/my-registrations', icon: ListChecks },
    { label: 'Profile', to: '/dashboard/profile', icon: UserRound },
  ],
  speaker: [
    { label: 'My Events', to: '/my-events', icon: CalendarDays },
    { label: 'My Sessions', to: '/my-sessions', icon: ListChecks },
    { label: 'Profile', to: '/dashboard/profile', icon: UserRound },
  ],
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigation = navigationByRole[user?.role] || navigationByRole.attendee;

  return (
    <div className="eventforge-dashboard-shell">
      <aside className="eventforge-sidebar">
        <div className="eventforge-sidebar__brand">EVENTFORGE</div>
        <nav className="eventforge-sidebar__nav" aria-label="Dashboard navigation">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to} className="eventforge-sidebar__link">
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="eventforge-sidebar__account">
          <div>
            <strong>{user?.name || 'EventForge User'}</strong>
            <span className="mono">{user?.role || 'member'}</span>
          </div>
          <button type="button" className="eventforge-sidebar__logout" onClick={logout}>
            <LogOut size={15} aria-hidden="true" />
            Logout
            <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <main className="eventforge-dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
