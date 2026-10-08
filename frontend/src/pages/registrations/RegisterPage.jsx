import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, Ticket as TicketIcon } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { getEvent } from '../../services/eventService';
import { createRegistration, getEventCoupons, getEventTickets } from '../../services/phase5Service';

const formatCurrency = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);

const emptyDetails = { fullName: '', email: '', phone: '', jobTitle: '' };

export function RegisterPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [ticketId, setTicketId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [attendeeDetails, setAttendeeDetails] = useState(emptyDetails);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  const selectedTicket = useMemo(() => tickets.find((ticket) => ticket._id === ticketId) || null, [tickets, ticketId]);
  const applicableCoupon = useMemo(() => coupons.find((coupon) => coupon.code.toUpperCase() === couponCode.trim().toUpperCase() && coupon.active) || null, [coupons, couponCode]);
  const subtotal = selectedTicket ? selectedTicket.price * quantity : 0;
  const discount = applicableCoupon && selectedTicket && subtotal >= (applicableCoupon.minimumAmount || 0)
    ? (applicableCoupon.discountType === 'PERCENTAGE' ? subtotal * (applicableCoupon.discountValue / 100) : Math.min(applicableCoupon.discountValue, subtotal))
    : 0;
  const total = Math.max(subtotal - discount, 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventResponse, ticketsResponse, couponsResponse] = await Promise.all([getEvent(eventId), getEventTickets(eventId), getEventCoupons(eventId)]);
        setEvent(eventResponse.data);
        setTickets(ticketsResponse.data.filter((ticket) => ticket.active && ticket.remainingCount > 0));
        setCoupons(couponsResponse.data);
        const initialTicket = new URLSearchParams(window.location.search).get('ticket');
        if (initialTicket) setTicketId(initialTicket);
      } catch (requestError) {
        setError(requestError.message || 'Event details could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  useEffect(() => {
    if (!user) return;
    setAttendeeDetails((current) => ({ ...current, fullName: user.name || '', email: user.email || '' }));
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedTicket) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await createRegistration(eventId, {
        ticketId,
        quantity,
        attendeeDetails: { ...attendeeDetails, email: attendeeDetails.email || user?.email },
        couponCode: couponCode.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setConfirmation(response.data);
    } catch (requestError) {
      setError(requestError.message || 'Registration could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="eventforge-loading-panel">Loading registration form…</div>;
  if (error && !event) return <div className="eventforge-error-panel"><strong>Registration unavailable.</strong><p>{error}</p><Link to={`/events/${eventId}`} className="eventforge-primary-link">Back to event</Link></div>;

  if (confirmation) {
    return (
      <div className="eventforge-event-page eventforge-page--form">
        <section className="eventforge-form-panel eventforge-success-panel">
          <CheckCircle2 size={42} aria-hidden="true" />
          <p className="eventforge-eyebrow">Registration confirmed</p>
          <h1>{confirmation.registrationCode}</h1>
          <p>{confirmation.ticket?.name} · {confirmation.status}</p>
          <div className="eventforge-summary-grid">
            <span>Quantity: {confirmation.quantity}</span>
            <span>Subtotal: {formatCurrency(confirmation.subtotal, confirmation.currency)}</span>
            <span>Discount: {formatCurrency(confirmation.discount, confirmation.currency)}</span>
            <span>Total: {formatCurrency(confirmation.totalAmount, confirmation.currency)}</span>
          </div>
          <div className="eventforge-form-actions">
            <Link to={`/events/${eventId}`} className="eventforge-button eventforge-button--secondary">Back to event</Link>
            <Link to="/my-registrations" className="eventforge-button">View my registrations</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="eventforge-event-page eventforge-page--form">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <div>
          <p className="eventforge-eyebrow">Register</p>
          <h1>{event?.name || 'EVENT REGISTRATION'}</h1>
        </div>
        <Link to={`/events/${eventId}`} className="eventforge-primary-link"><ArrowLeft size={15} aria-hidden="true" /> Back to event</Link>
      </header>

      <form className="eventforge-form-panel eventforge-event-form" onSubmit={handleSubmit}>
        <label className="eventforge-field">
          <span>Select ticket</span>
          <select className="eventforge-input" value={ticketId} onChange={(event) => setTicketId(event.target.value)} required>
            <option value="">Choose a ticket</option>
            {tickets.map((ticket) => <option key={ticket._id} value={ticket._id}>{ticket.name} · {formatCurrency(ticket.price, ticket.currency)}</option>)}
          </select>
        </label>

        {selectedTicket ? (
          <div className="eventforge-ticket-summary">
            <div className="eventforge-resource-card__icon"><TicketIcon size={20} aria-hidden="true" /></div>
            <div>
              <h2>{selectedTicket.name}</h2>
              <p>{selectedTicket.description || 'Included in this ticket.'}</p>
              <span>{selectedTicket.remainingCount} seats remaining</span>
            </div>
          </div>
        ) : null}

        <div className="eventforge-form-grid">
          <label className="eventforge-field">
            <span>Full name</span>
            <input className="eventforge-input" value={attendeeDetails.fullName} onChange={(event) => setAttendeeDetails((current) => ({ ...current, fullName: event.target.value }))} required />
          </label>
          <label className="eventforge-field">
            <span>Email</span>
            <input className="eventforge-input" type="email" value={attendeeDetails.email} onChange={(event) => setAttendeeDetails((current) => ({ ...current, email: event.target.value }))} required />
          </label>
          <label className="eventforge-field">
            <span>Phone</span>
            <input className="eventforge-input" value={attendeeDetails.phone} onChange={(event) => setAttendeeDetails((current) => ({ ...current, phone: event.target.value }))} />
          </label>
          <label className="eventforge-field">
            <span>Job title</span>
            <input className="eventforge-input" value={attendeeDetails.jobTitle} onChange={(event) => setAttendeeDetails((current) => ({ ...current, jobTitle: event.target.value }))} />
          </label>
          <label className="eventforge-field">
            <span>Quantity</span>
            <input className="eventforge-input" type="number" min="1" max={selectedTicket?.maxPerAttendee || 100} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} />
          </label>
        </div>

        <label className="eventforge-field">
          <span>Coupon code</span>
          <input className="eventforge-input" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Optional" />
          {applicableCoupon ? <small className="eventforge-field-success">{applicableCoupon.discountType === 'PERCENTAGE' ? `${applicableCoupon.discountValue}%` : formatCurrency(applicableCoupon.discountValue, selectedTicket?.currency)} available.</small> : couponCode ? <small className="eventforge-field-error">Coupon is unavailable or does not qualify.</small> : null}
        </label>

        <label className="eventforge-field">
          <span>Notes</span>
          <textarea className="eventforge-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional notes" />
        </label>

        <div className="eventforge-summary-card">
          <div><span>Subtotal</span><strong>{formatCurrency(subtotal, selectedTicket?.currency)}</strong></div>
          <div><span>Discount</span><strong>- {formatCurrency(discount, selectedTicket?.currency)}</strong></div>
          <div><span>Total</span><strong>{formatCurrency(total, selectedTicket?.currency)}</strong></div>
        </div>

        {error ? <p className="eventforge-form-error" role="alert">{error}</p> : null}
        <div className="eventforge-form-actions">
          <Link to={`/events/${eventId}`} className="eventforge-button eventforge-button--secondary">Cancel</Link>
          <Button type="submit" disabled={submitting || !selectedTicket}><CreditCard size={15} aria-hidden="true" /> {submitting ? 'Registering…' : 'Register'}</Button>
        </div>
      </form>
    </div>
  );
}
