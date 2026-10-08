import { ArrowUpRight, CalendarDays, CheckCircle2, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEventOverview, getEvents } from '../services/eventService';

const formatCount = (value) => Number(value || 0).toLocaleString();

export function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getEvents({ page: 1, limit: 100 });
        const eventSummaries = user?.role === 'organizer'
          ? await Promise.all(response.data.map((event) => getEventOverview(event._id)))
          : [];
        setEvents(response.data);
        setOverview(eventSummaries.map((item) => item.data));
      } catch (requestError) {
        setError(requestError.message || 'Unable to load event statistics.');
      } finally {
        setLoading(false);
      }
    };

    if (user) loadEvents();
  }, [user]);

  const stats = user?.role === 'organizer'
    ? [
        { label: 'Total events', value: formatCount(events.length), detail: 'Your events', icon: CalendarDays },
        { label: 'Upcoming events', value: formatCount(events.filter((event) => new Date(event.startDate) >= new Date()).length), detail: 'Scheduled and active', icon: CheckCircle2 },
        { label: 'Total attendees', value: formatCount(overview.reduce((total, event) => total + Number(event.totalRegistrations || 0), 0)), detail: 'Confirmed registrations', icon: Users },
        { label: 'Total speakers', value: formatCount(overview.reduce((total, event) => total + Number(event.totalSpeakers || 0), 0)), detail: 'Assigned to events', icon: Zap },
      ]
    : [
        { label: 'Your events', value: formatCount(events.length), detail: 'Assigned to you', icon: CalendarDays },
        { label: 'Your sessions', value: formatCount(events.length), detail: 'Session access', icon: CheckCircle2 },
      ];

  return (
    <div className="eventforge-dashboard">
      <header className="eventforge-dashboard__header">
        <div>
          <p className="eventforge-eyebrow">Dashboard</p>
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'operator'}.</h1>
        </div>
        <Link to={user?.role === 'attendee' ? '/events' : user?.role === 'speaker' ? '/my-events' : '/my-events'} className="eventforge-primary-link">
          View {user?.role === 'attendee' ? 'events' : 'my events'} <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </header>

      <section className="eventforge-stat-grid">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <article key={label} className="eventforge-stat-card">
            <div className="eventforge-stat-card__icon">
              <Icon size={18} aria-hidden="true" />
            </div>
            <strong>{value}</strong>
            <span>{label}</span>
            <small>{detail}</small>
          </article>
        ))}
      </section>

      {loading ? <div className="eventforge-loading-panel">Loading event statistics…</div> : null}
      {error ? <div className="eventforge-error-panel"><strong>Statistics unavailable.</strong><p>{error}</p></div> : null}

      <section className="eventforge-dashboard__panel">
        <div>
          <p className="eventforge-eyebrow">Current identity</p>
          <h2>{user?.role || 'member'} access</h2>
          <p>{user?.email || 'No email recorded'}</p>
        </div>
        <div className="eventforge-dashboard__badge">Authenticated</div>
      </section>
    </div>
  );
}
