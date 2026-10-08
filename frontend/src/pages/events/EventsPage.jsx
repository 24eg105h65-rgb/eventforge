import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, MapPin, Plus, Search, SlidersHorizontal, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { getEvents } from '../../services/eventService';

const eventTypes = ['all', 'conference', 'workshop', 'exhibition', 'seminar', 'networking', 'corporate', 'summit', 'other'];
const statuses = ['all', 'draft', 'published', 'ongoing', 'completed', 'cancelled'];

const formatDate = (value) => {
  if (!value) return 'Date to be announced';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
};

const formatStatus = (status) => status?.replace('-', ' ') || 'Draft';

export function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [eventType, setEventType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });

  const canCreate = ['platform_admin', 'organizer'].includes(user?.role);

  const loadEvents = async (nextPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await getEvents({
        search: search.trim() || undefined,
        status: status === 'all' ? undefined : status,
        eventType: eventType === 'all' ? undefined : eventType,
        page: nextPage,
        limit: 10,
      });
      setEvents(response.data);
      setPagination(response.pagination);
      setPage(nextPage);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, eventType]);

  const hasEvents = useMemo(() => events.length > 0, [events]);

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header">
        <div>
          <p className="eventforge-eyebrow">Events</p>
          <h1>EVENTS</h1>
          <p className="eventforge-page-subtitle">Everything you're building, in one place.</p>
        </div>
        {canCreate ? (
          <Button onClick={() => navigate('/events/new')}>
            <Plus size={15} aria-hidden="true" /> Create Event
          </Button>
        ) : null}
      </header>

      <section className="eventforge-event-toolbar" aria-label="Event filters">
        <label className="eventforge-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search events"
            aria-label="Search events"
          />
        </label>
        <div className="eventforge-toolbar__selects">
          <label>
            <SlidersHorizontal size={15} aria-hidden="true" />
            <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
              {statuses.map((value) => <option key={value} value={value}>{value === 'all' ? 'All statuses' : formatStatus(value)}</option>)}
            </select>
          </label>
          <label>
            <CalendarDays size={15} aria-hidden="true" />
            <select value={eventType} onChange={(event) => setEventType(event.target.value)} aria-label="Filter by event type">
              {eventTypes.map((value) => <option key={value} value={value}>{value === 'all' ? 'All types' : value}</option>)}
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <div className="eventforge-loading-panel" aria-live="polite">Loading events…</div>
      ) : error ? (
        <div className="eventforge-error-panel" role="alert">
          <strong>Unable to load events.</strong>
          <p>{error}</p>
          <Button type="button" variant="secondary" onClick={() => loadEvents(page)}>Try again</Button>
        </div>
      ) : hasEvents ? (
        <motion.div className="eventforge-event-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {events.map((event, index) => (
            <motion.article key={event._id} className="eventforge-event-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
              <div className="eventforge-event-card__image" style={{ backgroundImage: `linear-gradient(135deg, rgba(0,0,0,.7), rgba(0,0,0,.2)), url(${event.bannerImage || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'})` }}>
                <span>{event.eventType}</span>
              </div>
              <div className="eventforge-event-card__body">
                <div className="eventforge-event-card__meta">
                  <span className={`eventforge-status eventforge-status--${event.status}`}>{formatStatus(event.status)}</span>
                  <span>{event.capacity} capacity</span>
                </div>
                <h2>{event.name}</h2>
                <p className="eventforge-event-card__date">{formatDate(event.startDate)}</p>
                <p className="eventforge-event-card__location"><MapPin size={14} aria-hidden="true" /> {event.city || event.venue || 'Location to be announced'}</p>
                <div className="eventforge-event-card__details">
                  <span><CalendarDays size={13} aria-hidden="true" /> {formatDate(event.startDate)}</span>
                  <span><Users size={13} aria-hidden="true" /> {event.capacity} seats</span>
                </div>
                <Link className="eventforge-link" to={`/events/${event._id}`}>
                  View details <ChevronRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          title="No events yet"
          description="Create your first event and begin organizing the experience around it."
          action={canCreate ? <Button onClick={() => navigate('/events/new')}><Plus size={15} aria-hidden="true" /> Create Event</Button> : null}
        />
      )}

      {pagination.total > 10 ? (
        <div className="eventforge-pagination">
          <Button type="button" variant="secondary" disabled={page === 1} onClick={() => loadEvents(page - 1)}>Previous</Button>
          <span>{page} / {pagination.pages}</span>
          <Button type="button" variant="secondary" disabled={page >= pagination.pages} onClick={() => loadEvents(page + 1)}>Next</Button>
        </div>
      ) : null}
    </div>
  );
}
