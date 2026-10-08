import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, CreditCard, Ticket as TicketIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMyRegistrations } from '../../services/phase5Service';

const formatCurrency = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);
const formatDate = (value) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyRegistrations()
      .then((response) => setRegistrations(response.data))
      .catch((requestError) => setError(requestError.message || 'Registrations could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="eventforge-loading-panel">Loading registrations…</div>;
  if (error) return <div className="eventforge-error-panel"><strong>Registrations unavailable.</strong><p>{error}</p><Link to="/events" className="eventforge-primary-link">Browse events</Link></div>;

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header">
        <div>
          <p className="eventforge-eyebrow">My registrations</p>
          <h1>MY REGISTRATIONS</h1>
          <p className="eventforge-page-subtitle">Your ticket bookings and registration status.</p>
        </div>
        <Link to="/events" className="eventforge-primary-link"><ArrowLeft size={15} aria-hidden="true" /> Events</Link>
      </header>

      {registrations.length ? (
        <div className="eventforge-resource-grid">
          {registrations.map((registration) => (
            <article key={registration._id} className="eventforge-resource-card">
              <div className="eventforge-resource-card__icon"><TicketIcon size={20} aria-hidden="true" /></div>
              <div className="eventforge-resource-card__content">
                <h2>{registration.event?.name}</h2>
                <p>{registration.ticket?.name} · {registration.attendeeDetails?.fullName || 'Attendee'}</p>
                <div className="eventforge-ticket-meta">
                  <span><strong>{registration.registrationCode}</strong> code</span>
                  <span><strong>{registration.quantity}</strong> ticket(s)</span>
                  <span><strong>{formatCurrency(registration.totalAmount, registration.currency)}</strong> total</span>
                </div>
                <div className="eventforge-resource-card__status">
                  <span className={`eventforge-status eventforge-status--${registration.status === 'CONFIRMED' ? 'published' : registration.status === 'CANCELLED' ? 'cancelled' : 'draft'}`}>{registration.status}</span>
                  <span><CalendarDays size={13} aria-hidden="true" /> {formatDate(registration.registeredAt)}</span>
                </div>
              </div>
              <div className="eventforge-resource-card__actions">
                <Link to={`/events/${registration.event?._id}`} className="eventforge-primary-link"><CreditCard size={15} aria-hidden="true" /> Event</Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="eventforge-empty-state"><h2>No registrations yet</h2><p>Choose an event and register for a ticket.</p><Link to="/events" className="eventforge-primary-link">Browse events</Link></div>
      )}
    </div>
  );
}
