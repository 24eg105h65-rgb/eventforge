import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CreditCard, Edit3, Plus, Trash2, Ticket as TicketIcon } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { getEvent } from '../../services/eventService';
import { deleteTicket, getEventTickets } from '../../services/phase5Service';

const formatCurrency = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);

const formatStatus = (value) => (value ? 'Active' : 'Inactive');

export function TicketsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const canManage = useMemo(() => ['platform_admin', 'organizer'].includes(user?.role), [user]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [eventResponse, ticketsResponse] = await Promise.all([getEvent(eventId), getEventTickets(eventId)]);
      setEvent(eventResponse.data);
      setTickets(ticketsResponse.data);
    } catch (requestError) {
      setError(requestError.message || 'Tickets could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  const handleDelete = async (ticketId) => {
    if (!window.confirm('Delete this ticket?')) return;
    setDeletingId(ticketId);
    try {
      await deleteTicket(ticketId);
      setTickets((current) => current.filter((ticket) => ticket._id !== ticketId));
    } catch (requestError) {
      setError(requestError.message || 'Ticket could not be deleted.');
    } finally {
      setDeletingId('');
    }
  };

  if (loading) return <div className="eventforge-loading-panel">Loading tickets…</div>;
  if (error) return <div className="eventforge-error-panel"><strong>Tickets unavailable.</strong><p>{error}</p><Link to={`/events/${eventId}`} className="eventforge-primary-link">Back to event</Link></div>;

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header">
        <div>
          <p className="eventforge-eyebrow">Tickets</p>
          <h1>{event?.name || 'EVENT TICKETS'}</h1>
          <p className="eventforge-page-subtitle">Manage available admissions for this event.</p>
        </div>
        <div className="eventforge-form-actions">
          <Link to={`/events/${eventId}`} className="eventforge-primary-link"><ArrowLeft size={15} aria-hidden="true" /> Event</Link>
          {canManage ? <Button onClick={() => navigate(`/events/${eventId}/tickets/new`)}><Plus size={15} aria-hidden="true" /> Create ticket</Button> : null}
        </div>
      </header>

      {tickets.length ? (
        <div className="eventforge-resource-grid">
          {tickets.map((ticket) => (
            <article key={ticket._id} className="eventforge-resource-card">
              <div className="eventforge-resource-card__icon"><TicketIcon size={20} aria-hidden="true" /></div>
              <div className="eventforge-resource-card__content">
                <h2>{ticket.name}</h2>
                <p>{ticket.description || 'No description provided.'}</p>
                <div className="eventforge-ticket-meta">
                  <span><strong>{formatCurrency(ticket.price, ticket.currency)}</strong> price</span>
                  <span><strong>{ticket.capacity}</strong> capacity</span>
                  <span><strong>{ticket.remainingCount}</strong> remaining</span>
                  <span><strong>{ticket.soldCount}</strong> sold</span>
                </div>
                <div className="eventforge-resource-card__status">
                  <span className={`eventforge-status ${ticket.active ? 'eventforge-status--published' : 'eventforge-status--cancelled'}`}>{formatStatus(ticket.active)}</span>
                  <span>{ticket.type}</span>
                </div>
              </div>
              <div className="eventforge-resource-card__actions">
                <Link to={`/events/${eventId}/tickets/${ticket._id}`} className="eventforge-primary-link"><CreditCard size={15} aria-hidden="true" /> Details</Link>
                {canManage ? (
                  <>
                    <Link to={`/events/${eventId}/tickets/${ticket._id}/edit`} className="eventforge-primary-link"><Edit3 size={15} aria-hidden="true" /> Edit</Link>
                    <Button variant="secondary" onClick={() => handleDelete(ticket._id)} disabled={deletingId === ticket._id}>
                      <Trash2 size={15} aria-hidden="true" /> {deletingId === ticket._id ? 'Deleting…' : 'Delete'}
                    </Button>
                  </>
                ) : null}
                {!canManage ? <Link to={`/events/${eventId}/register?ticket=${ticket._id}`} className="eventforge-primary-link">Register</Link> : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No tickets available" description="Create the first ticket for this event." action={canManage ? <Button onClick={() => navigate(`/events/${eventId}/tickets/new`)}><Plus size={15} aria-hidden="true" /> Create ticket</Button> : null} />
      )}
    </div>
  );
}
