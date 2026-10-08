import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, MapPin, Pencil, Trash2, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { getSession, deleteSession } from '../../services/sessionService';

const formatDateTime = (value) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const formatStatus = (value) => value ? value.replace('-', ' ') : 'Draft';

export function SessionDetailsPage() {
  const { eventId, sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOrganizer = user?.role === 'organizer';
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getSession(sessionId);
        setSession(response.data);
      } catch (requestError) {
        setError(requestError.message || 'Session could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [sessionId]);

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete ${session.title}? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteSession(sessionId);
      toast.success('Session deleted.');
      navigate(`/events/${eventId}/sessions`);
    } catch (requestError) {
      toast.error(requestError.message || 'Session could not be deleted.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="eventforge-loading-panel">Loading session…</div>;
  if (error) return <div className="eventforge-error-panel"><strong>Session unavailable.</strong><p>{error}</p><Link to={`/events/${eventId}/sessions`} className="eventforge-primary-link">Return to sessions</Link></div>;
  if (!session) return null;

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <Link to={`/events/${eventId}/sessions`} className="eventforge-back-link"><ArrowLeft size={15} aria-hidden="true" /> Sessions</Link>
        <div>
          <p className="eventforge-eyebrow">Session details</p>
          <h1>{session.title}</h1>
        </div>
      </header>

      <section className="eventforge-detail-hero eventforge-detail-hero--resource">
        <div>
          <span className={`eventforge-status eventforge-status--${session.status || 'draft'}`}>{formatStatus(session.status)}</span>
          <h2>{session.sessionType || 'Other'}</h2>
          <p>{session.venue?.name || 'Venue not assigned'}</p>
        </div>
      </section>

      <div className="eventforge-detail-content">
        <article className="eventforge-detail-panel">
          <h2>Session information</h2>
          <p>{session.description || 'No description provided.'}</p>
          <dl className="eventforge-detail-list">
            <div><dt><CalendarDays size={14} /> Start</dt><dd>{formatDateTime(session.startTime)}</dd></div>
            <div><dt><Clock3 size={14} /> End</dt><dd>{formatDateTime(session.endTime)}</dd></div>
            <div><dt><MapPin size={14} /> Venue</dt><dd>{session.venue?.name || 'Not assigned'}</dd></div>
            <div><dt><Users size={14} /> Capacity</dt><dd>{session.capacity}</dd></div>
            <div><dt>Speakers</dt><dd>{session.speakers?.length ? session.speakers.join(', ') : 'Not assigned'}</dd></div>
            <div><dt>Track</dt><dd>{session.track || 'Not specified'}</dd></div>
            <div><dt>Tags</dt><dd>{session.tags?.length ? session.tags.join(', ') : 'None'}</dd></div>
          </dl>
          {session.livestreamUrl ? <p><a href={session.livestreamUrl} target="_blank" rel="noreferrer" className="eventforge-link">Open livestream</a></p> : null}
          {session.recordingUrl ? <p><a href={session.recordingUrl} target="_blank" rel="noreferrer" className="eventforge-link">Open recording</a></p> : null}
        </article>

        {isOrganizer ? (
          <aside className="eventforge-detail-panel eventforge-detail-panel--sidebar">
            <h2>Actions</h2>
            <div className="eventforge-action-stack">
              <Link to={`/events/${eventId}/sessions/${sessionId}/edit`} className="eventforge-primary-link"><Pencil size={15} aria-hidden="true" /> Edit session</Link>
              <Button type="button" variant="secondary" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete session'}</Button>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
