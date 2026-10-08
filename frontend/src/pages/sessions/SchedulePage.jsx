import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Filter, MapPin, Search, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getSchedule } from '../../services/sessionService';
import { getVenues } from '../../services/venueService';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';

const formatDateTime = (value) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const formatStatus = (value) => value ? value.replace('-', ' ') : 'Draft';

export function SchedulePage() {
  const { eventId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [venues, setVenues] = useState([]);
  const [filters, setFilters] = useState({ date: '', venue: '', sessionType: '', status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSchedule = async (nextFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      const response = await getSchedule(eventId, Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value)));
      setSessions(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load the schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await getVenues(eventId);
        setVenues(Array.isArray(response.data) ? response.data : []);
      } catch {
        setVenues([]);
      }
    };
    loadOptions();
    loadSchedule();
  }, [eventId]);

  const orderedSessions = useMemo(() => [...sessions].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)), [sessions]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    const nextFilters = { ...filters, [name]: value };
    setFilters(nextFilters);
    loadSchedule(nextFilters);
  };

  const handleReset = () => {
    const nextFilters = { date: '', venue: '', sessionType: '', status: '', search: '' };
    setFilters(nextFilters);
    loadSchedule(nextFilters);
  };

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header">
        <div>
          <Link to={`/events/${eventId}`} className="eventforge-back-link"><CalendarDays size={15} aria-hidden="true" /> Event</Link>
          <p className="eventforge-eyebrow">Schedule</p>
          <h1>PROGRAM TIMELINE</h1>
        </div>
      </header>

      <section className="eventforge-schedule-filters">
        <label><span>Date</span><input type="date" name="date" value={filters.date} onChange={handleFilterChange} /></label>
        <label><span>Venue</span><select name="venue" value={filters.venue} onChange={handleFilterChange}><option value="">All venues</option>{venues.map((venue) => <option key={venue._id} value={venue._id}>{venue.name}</option>)}</select></label>
        <label><span>Type</span><select name="sessionType" value={filters.sessionType} onChange={handleFilterChange}><option value="">All types</option><option value="keynote">Keynote</option><option value="workshop">Workshop</option><option value="panel">Panel</option><option value="talk">Talk</option><option value="networking">Networking</option><option value="breakout">Breakout</option><option value="fireside-chat">Fireside chat</option><option value="other">Other</option></select></label>
        <label><span>Status</span><select name="status" value={filters.status} onChange={handleFilterChange}><option value="">All status</option><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
        <label className="eventforge-schedule-filters__search"><span>Search</span><input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Session or venue" /> <Search size={14} aria-hidden="true" /></label>
        <Button type="button" variant="secondary" onClick={handleReset}><Filter size={14} aria-hidden="true" /> Reset</Button>
      </section>

      {loading ? <div className="eventforge-loading-panel" aria-live="polite">Loading schedule…</div> : error ? <div className="eventforge-error-panel" role="alert"><strong>Unable to load schedule.</strong><p>{error}</p><Button type="button" variant="secondary" onClick={() => loadSchedule()}>Try again</Button></div> : orderedSessions.length ? <div className="eventforge-schedule-list">{orderedSessions.map((session) => <article key={session._id} className="eventforge-schedule-item"><div className="eventforge-schedule-item__time"><strong>{new Date(session.startTime).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</strong><span>{new Date(session.startTime).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}</span></div><div className="eventforge-schedule-item__content"><div className="eventforge-resource-card__topline"><span className={`eventforge-status eventforge-status--${session.status || 'draft'}`}>{formatStatus(session.status)}</span><span>{session.sessionType || 'Other'}</span></div><h2>{session.title}</h2><p>{session.description || 'No description available.'}</p><div className="eventforge-session-card__meta"><span><CalendarDays size={14} aria-hidden="true" /> {formatDateTime(session.startTime)}</span><span><Clock3 size={14} aria-hidden="true" /> {new Date(session.endTime).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}</span><span><Users size={14} aria-hidden="true" /> {session.capacity}</span></div>{session.venue?.name ? <span className="eventforge-session-card__venue"><MapPin size={14} aria-hidden="true" /> {session.venue.name}</span> : null}</div><Link to={`/events/${eventId}/sessions/${session._id}`} className="eventforge-link">Open session</Link></article>)}</div> : <EmptyState eyebrow="No schedule" title="No sessions match the filters" description="Try changing the date or venue filter to find the right slot." action={<Button type="button" variant="secondary" onClick={handleReset}>Clear filters</Button>} />}
    </div>
  );
}
