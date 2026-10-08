import { ArrowLeft, CalendarDays, DollarSign, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getTicket } from '../../services/phase5Service';

const formatCurrency = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);
const formatDate = (value) => (value ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not set');

export function TicketDetailsPage() {
  const { eventId, ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getTicket(ticketId)
      .then((response) => setTicket(response.data))
      .catch((requestError) => setError(requestError.message || 'Ticket could not be loaded.'))
      .finally(() => setLoading(false));
  }, [ticketId]);

  if (loading) return <div className="eventforge-loading-panel">Loading ticket…</div>;
  if (error) return <div className="eventforge-error-panel"><strong>Ticket unavailable.</strong><p>{error}</p><Link to={`/events/${eventId}/tickets`} className="eventforge-primary-link">Back to tickets</Link></div>;
  if (!ticket) return null;

  return (
    <div className="eventforge-event-page eventforge-page--form">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <div>
          <p className="eventforge-eyebrow">Ticket details</p>
          <h1>{ticket.name}</h1>
        </div>
        <Link to={`/events/${eventId}/tickets`} className="eventforge-primary-link"><ArrowLeft size={15} aria-hidden="true" /> Back to tickets</Link>
      </header>

      <section className="eventforge-form-panel">
        <div className="eventforge-detail-list">
          <div><dt><DollarSign size={14} aria-hidden="true" /> Price</dt><dd>{formatCurrency(ticket.price, ticket.currency)}</dd></div>
          <div><dt><Users size={14} aria-hidden="true" /> Capacity</dt><dd>{ticket.capacity}</dd></div>
          <div><dt><Users size={14} aria-hidden="true" /> Sold</dt><dd>{ticket.soldCount}</dd></div>
          <div><dt><Users size={14} aria-hidden="true" /> Remaining</dt><dd>{ticket.remainingCount}</dd></div>
          <div><dt><CalendarDays size={14} aria-hidden="true" /> Sale window</dt><dd>{formatDate(ticket.saleStart)} — {formatDate(ticket.saleEnd)}</dd></div>
          <div><dt><CalendarDays size={14} aria-hidden="true" /> Status</dt><dd>{ticket.active ? 'Active' : 'Inactive'}</dd></div>
        </div>
        <p className="eventforge-page-subtitle">{ticket.description || 'No description provided.'}</p>
      </section>
    </div>
  );
}
