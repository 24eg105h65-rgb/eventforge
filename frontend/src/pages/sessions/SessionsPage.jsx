import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { getSessions, deleteSession } from '../../services/sessionService';

const formatDateTime = (value) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const formatStatus = (value) => value ? value.replace('-', ' ') : 'Draft';

export function SessionsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOrganizer = user?.role === 'organizer';
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getSessions(eventId);
      setSessions(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [eventId]);

  const handleDelete = async (session) => {
    const confirmed = window.confirm(`Delete ${session.title}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(session._id);
    try {
      await deleteSession(session._id);
      toast.success('Session deleted.');
      setSessions((current) => current.filter((item) => item._id !== session._id));
    } catch (requestError) {
      toast.error(requestError.message || 'Session could not be deleted.');
    } finally {
      setDeletingId(null);
    }
  };

  const orderedSessions = useMemo(() => [...sessions].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)), [sessions]);

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header">
        <div>
          <Link to={`/events/${eventId}`} className="eventforge-back-link"><CalendarDays size={15} aria-hidden="true" /> Event</Link>
          <p className="eventforge-eyebrow">Sessions</p>
          <h1>PROGRAM</h1>
        </div>
        {isOrganizer ? <Button onClick={() => navigate(`/events/${eventId}/sessions/new`)}><Plus size={15} aria-hidden="true" /> Add session</Button> : null}
      </header>

      {loading ? (
        <div className="eventforge-loading-panel" aria-live="polite">Loading sessions…</div>
      ) : error ? (
        <div className="eventforge-error-panel" role="alert">
          <strong>Unable to load sessions.</strong>
          <p>{error}</p>
          <Button type="button" variant="secondary" onClick={loadSessions}>Try again</Button>
        </div>
      ) : orderedSessions.length ? (
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
                <Link to={`/events/${eventId}/sessions/${session._id}`} className="eventforge-link">Details</Link>
                {isOrganizer ? (
                  <>
                    <Link to={`/events/${eventId}/sessions/${session._id}/edit`} aria-label={`Edit ${session.title}`}><Pencil size={16} aria-hidden="true" /></Link>
                    <button type="button" onClick={() => handleDelete(session)} disabled={deletingId === session._id} aria-label={`Delete ${session.title}`}>
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow="No sessions"
          title="No sessions scheduled"
          description="Add a session and assign it to a venue and speaker."
          action={isOrganizer ? <Button onClick={() => navigate(`/events/${eventId}/sessions/new`)}><Plus size={15} aria-hidden="true" /> Add session</Button> : undefined}
        />
      )}
    </div>
  );
}
