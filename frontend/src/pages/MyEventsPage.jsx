import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, MapPin, Search, SlidersHorizontal, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/ui/EmptyState';
import { getEvents } from '../services/eventService';
import { getSessions } from '../services/sessionService';

const statuses = ['all', 'draft', 'published', 'ongoing', 'completed', 'cancelled'];

const formatDate = (value) => {
  if (!value) return 'Date to be announced';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
};

const formatStatus = (status) => status?.replace('-', ' ') || 'Draft';

export function MyEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getEvents({ page: 1, limit: 100 });
        let roleEvents = response.data.filter((event) => {
          return event.createdBy === user._id || event.organizer?._id === user._id || event.organizer === user._id;
        });

        if (user.role === 'speaker') {
          const sessionLists = await Promise.all(response.data.map((event) => getSessions(event._id)));
          const assignedEventIds = new Set(sessionLists
            .flatMap((result) => result.data || [])
            .filter((session) => session.speakers?.some((speaker) => speaker?._id === user._id || speaker === user._id))
            .map((session) => session.event));
          roleEvents = response.data.filter((event) => assignedEventIds.has(event._id));
        }

        setEvents(roleEvents);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load your events.');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [user]);

  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = !search || event.name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === 'all' || event.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [events, search, status]);

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header">
        <div>
          <p className="eventforge-eyebrow">My events</p>
          <h1>EVENTS</h1>
        </div>
      </header>

      <section className="eventforge-event-toolbar" aria-label="Event filters">
        <label className="eventforge-search">
          <Search size={15} aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search my events" aria-label="Search my events" />
        </label>
        <label>
          <SlidersHorizontal size={15} aria-hidden="true" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
            {statuses.map((value) => <option key={value} value={value}>{value === 'all' ? 'All statuses' : formatStatus(value)}</option>)}
          </select>
        </label>
      </section>

      {loading ? <div className="eventforge-loading-panel">Loading your events…</div> : null}
      {error ? <div className="eventforge-error-panel"><strong>Events unavailable.</strong><p>{error}</p></div> : null}
      {!loading && !error && !visibleEvents.length ? (
        <EmptyState title="No events assigned" description="You do not have any events in this view yet." />
      ) : null}
      {!loading && !error && visibleEvents.length ? (
        <motion.div className="eventforge-event-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {visibleEvents.map((event, index) => (
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
                <Link className="eventforge-link" to={`/events/${event._id}`}>View details <ChevronRight size={14} aria-hidden="true" /></Link>
              </div>
            </motion.article>
          ))}
        </motion.div>
      ) : null}
    </div>
  );
}
