import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/ui/EmptyState';
import { getEvents } from '../services/eventService';
import { getSessions } from '../services/sessionService';

const formatDateTime = (value) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const formatStatus = (value) => value ? value.replace('-', ' ') : 'Draft';

export function MySessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getEvents({ page: 1, limit: 100 });
        const events = response.data;
        const sessionLists = await Promise.all(events.map((event) => getSessions(event._id)));
        const assignedSessions = sessionLists
          .flatMap((result) => result.data || [])
          .filter((session) => session.speakers?.some((speaker) => speaker?._id === user._id || speaker === user._id));
        setSessions(assignedSessions);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load your sessions.');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [user]);

  const orderedSessions = useMemo(() => [...sessions].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)), [sessions]);

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header">
        <div>
          <p className="eventforge-eyebrow">My sessions</p>
          <h1>SESSIONS</h1>
        </div>
      </header>

      {loading ? <div className="eventforge-loading-panel">Loading your sessions…</div> : null}
      {error ? <div className="eventforge-error-panel"><strong>Sessions unavailable.</strong><p>{error}</p></div> : null}
      {!loading && !error && !orderedSessions.length ? <EmptyState title="No sessions assigned" description="You have not been assigned any sessions yet." /> : null}
      {!loading && !error && orderedSessions.length ? (
        <div className="eventforge-resource-grid">
          {orderedSessions.map((session) => (
            <article key={session._id} className="eventforge-resource-card eventforge-resource-card--session">
              <div className="eventforge-resource-card__content">
                <div className="eventforge-resource-card__topline">
                  <span className={`eventforge-status eventforge-status--${session.status || 'draft'}`}>{formatStatus(session.status)}</span>
                  <span>{session.sessionType || 'Other'}</span>
                </div>
                <h2>{session.title}</h2>
                <p>{session.description || 'No description available.'}</p>
                <div className="eventforge-session-card__meta">
                  <span><CalendarDays size={14} aria-hidden="true" /> {formatDateTime(session.startTime)}</span>
                  <span><Clock3 size={14} aria-hidden="true" /> {Math.max(1, Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000))} min</span>
                  <span><Users size={14} aria-hidden="true" /> {session.capacity}</span>
                </div>
                {session.venue?.name ? <span className="eventforge-session-card__venue"><MapPin size={14} aria-hidden="true" /> {session.venue.name}</span> : null}
              </div>
              <div className="eventforge-resource-card__actions">
                <Link to={`/events/${session.event?._id || session.event}/sessions/${session._id}`} className="eventforge-link">Details</Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
