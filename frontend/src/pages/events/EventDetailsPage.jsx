import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Edit3, MapPin, PencilLine, Users, UserRound, Mail, Globe, Ticket, Clock3, ChevronRight, Ticket as TicketIcon, CreditCard, Tag } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDeleteModal } from '../../components/events/ConfirmDeleteModal';
import { deleteEvent, getEvent, getEventOverview } from '../../services/eventService';
import { getEventRegistrations } from '../../services/phase5Service';
import { getSessions } from '../../services/sessionService';

const tabs = ['Overview', 'Sessions', 'Schedule'];

const formatDateTime = (value) => {
  if (!value) return 'Not specified';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

export function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      setError('');
      try {
        const [eventResponse, overviewResponse, sessionsResponse] = await Promise.all([
          getEvent(id),
          getEventOverview(id),
          getSessions(id),
        ]);
        const isRegistrationManager = user?.role === 'organizer' || user?.role === 'platform_admin';
        const registrationsResponse = isRegistrationManager ? await getEventRegistrations(id) : null;

        setEvent(eventResponse.data);
        setOverview(overviewResponse.data);
        setSessions(Array.isArray(sessionsResponse.data) ? sessionsResponse.data : []);
        setAttendeeCount(
          registrationsResponse
            ? registrationsResponse.data.reduce((total, registration) => total + Number(registration.quantity || 0), 0)
            : Number(overviewResponse.data.totalRegistrations || 0),
        );
      } catch (requestError) {
        setError(requestError.message || 'Event could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    if (id && user) loadEvent();
  }, [id, user]);

  const isOwner = useMemo(() => {
    if (!user || !event) return false;
    return user.role === 'platform_admin' || user._id === event.createdBy;
  }, [user, event]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteEvent(id);
      toast.success('Event deleted.');
      navigate('/events');
    } catch (requestError) {
      toast.error(requestError.message || 'Event could not be deleted.');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'Sessions') navigate(`/events/${id}/sessions`);
    if (tab === 'Schedule') navigate(`/events/${id}/schedule`);
  };

  const speakers = [...new Map(sessions
    .flatMap((session) => session.speakers || [])
    .map((speaker) => [speaker?._id || speaker, speaker]))
    .values()];

  if (loading) return <div className="eventforge-loading-panel">Loading event…</div>;
  if (error) return <div className="eventforge-error-panel"><strong>Event unavailable.</strong><p>{error}</p><Link to="/events" className="eventforge-primary-link">Return to events</Link></div>;
  if (!event) return <EmptyState title="Event not found" description="The event may have been removed or you may not have access." action={<Link to="/events" className="eventforge-primary-link">Back to events</Link>} />;

  return (
    <div className="eventforge-event-page eventforge-event-detail">
      <header className="eventforge-detail-header">
        <Link to="/events" className="eventforge-back-link"><ArrowLeft size={15} aria-hidden="true" /> Events</Link>
        <div className="eventforge-detail-header__main">
          <div>
            <p className="eventforge-eyebrow">{event.eventType}</p>
            <h1>{event.name}</h1>
          </div>
          <div className="eventforge-detail-header__actions">
            <span className={`eventforge-status eventforge-status--${event.status}`}>{event.status}</span>
            {isOwner ? <Button variant="secondary" onClick={() => navigate(`/events/${event._id}/edit`)}><Edit3 size={15} aria-hidden="true" /> Edit</Button> : null}
          </div>
        </div>
      </header>

      <section className="eventforge-detail-hero" style={{ backgroundImage: `linear-gradient(135deg, rgba(0,0,0,.78), rgba(0,0,0,.32)), url(${event.bannerImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'})` }}>
        <div>
          <p>Event overview</p>
          <h2>{event.city || event.venue || 'Location to be announced'}</h2>
          <p>{formatDateTime(event.startDate)} – {formatDateTime(event.endDate)}</p>
        </div>
      </section>

      <nav className="eventforge-detail-tabs" aria-label="Event sections">
        {tabs.map((tab) => <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} onClick={() => handleTabChange(tab)}>{tab}</button>)}
      </nav>

      {activeTab === 'Overview' ? (
        <div className="eventforge-detail-content">
          <motion.article className="eventforge-detail-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2>Event details</h2>
            <p>{event.description || 'No description provided yet.'}</p>
            <dl className="eventforge-detail-list">
              <div><dt><CalendarDays size={14} /> Date and time</dt><dd>{formatDateTime(event.startDate)} — {formatDateTime(event.endDate)}</dd></div>
              <div><dt><MapPin size={14} /> Location</dt><dd>{event.venue || 'Not specified'}{event.city ? `, ${event.city}` : ''}{event.country ? `, ${event.country}` : ''}</dd></div>
              <div><dt><Users size={14} /> Maximum attendees</dt><dd>{formatNumber(event.capacity)}</dd></div>
              <div><dt><Users size={14} /> Current attendees</dt><dd>{formatNumber(attendeeCount)}</dd></div>
              <div><dt><Clock3 size={14} /> Registration</dt><dd>{event.registrationOpen ? `${formatDateTime(event.registrationOpen)} — ${formatDateTime(event.registrationClose)}` : 'Not open'}</dd></div>
            </dl>
          </motion.article>

          <aside className="eventforge-detail-panel eventforge-detail-panel--sidebar">
            <h2>Speakers and schedule</h2>
            <div className="eventforge-stat-grid eventforge-stat-grid--compact">
              <div className="eventforge-stat-card"><strong>{formatNumber(speakers.length)}</strong><span>Speakers</span><small>Assigned sessions</small></div>
              <div className="eventforge-stat-card"><strong>{formatNumber(sessions.length)}</strong><span>Sessions</span><small>Scheduled</small></div>
            </div>
            <div className="eventforge-detail-panel__list">
              {speakers.length ? speakers.map((speaker) => <div key={speaker._id || speaker.user} className="eventforge-detail-list__item"><UserRound size={14} aria-hidden="true" /><span>{speaker.displayName || speaker.name}</span></div>) : <p>No speakers assigned yet.</p>}
            </div>
          </aside>
        </div>
      ) : activeTab === 'Sessions' ? (
        <div className="eventforge-detail-content">
          <motion.article className="eventforge-detail-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2>Sessions</h2>
            <p>Manage the event schedule and speaker assignments.</p>
            {sessions.length ? <ul className="eventforge-detail-list__items">{sessions.map((session) => <li key={session._id}><strong>{session.title}</strong><span>{formatDateTime(session.startTime)}</span></li>)}</ul> : <p>No sessions scheduled yet.</p>}
          </motion.article>
        </div>
      ) : (
        <div className="eventforge-detail-content">
          <motion.article className="eventforge-detail-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2>Schedule</h2>
            <p>{sessions.length ? 'Event sessions and timing.' : 'No schedule is available yet.'}</p>
            {sessions.length ? <ul className="eventforge-detail-list__items">{sessions.map((session) => <li key={session._id}><strong>{session.title}</strong><span>{formatDateTime(session.startTime)} — {formatDateTime(session.endTime)}</span></li>)}</ul> : null}
          </motion.article>
        </div>
      )}

      <section className="eventforge-detail-meta">
        {event.organizer ? <div><UserRound size={15} /><span>{event.organizer.name}</span></div> : null}
        {event.contactEmail ? <div><Mail size={15} /><span>{event.contactEmail}</span></div> : null}
        {event.website ? <div><Globe size={15} /><a href={event.website} target="_blank" rel="noreferrer">Website <ChevronRight size={12} /></a></div> : null}
      </section>

      <section className="eventforge-detail-actions">
        {isOwner ? (
          <>
            <Button variant="secondary" onClick={() => navigate(`/events/${id}/edit`)}><Edit3 size={15} aria-hidden="true" /> Edit Event</Button>
            <Button onClick={() => navigate(`/events/${id}/sessions`)}><CalendarDays size={15} aria-hidden="true" /> Manage Sessions</Button>
            <Button variant="secondary" onClick={() => navigate(`/events/${id}/sessions`)}><Users size={15} aria-hidden="true" /> Manage Speakers</Button>
            <Button variant="secondary" onClick={() => navigate(`/events/${id}/registrations`)}><Users size={15} aria-hidden="true" /> View Registrations</Button>
          </>
        ) : null}
        {user?.role === 'attendee' ? <Link to={`/events/${id}/register`} className="eventforge-primary-link"><CreditCard size={15} aria-hidden="true" /> Register</Link> : null}
      </section>

      {isOwner ? (
        <div className="eventforge-detail-danger">
          <div>
            <p className="eventforge-eyebrow">Danger zone</p>
            <h2>Remove event</h2>
          </div>
          <Button type="button" variant="secondary" onClick={() => setDeleteOpen(true)}><Ticket size={15} aria-hidden="true" /> Delete event</Button>
        </div>
      ) : null}

      <ConfirmDeleteModal open={deleteOpen} eventName={event.name} onCancel={() => setDeleteOpen(false)} onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
