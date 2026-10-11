import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, Download, QrCode, Ticket as TicketIcon, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { getEvent } from '../../services/eventService';
import { createRegistration, getEventTickets } from '../../services/phase5Service';

const formatCurrency = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);

const emptyDetails = { fullName: '', email: '', phone: '' };

/* ── QR Ticket Modal ──────────────────────────────────────────────── */
function QRTicketModal({ confirmation, event, onClose, onViewRegistrations }) {
  const qrValue = JSON.stringify({
    code: confirmation.registrationCode,
    event: event?.name,
    ticket: confirmation.ticket?.name,
    qty: confirmation.quantity,
    status: confirmation.status,
  });

  const handleDownload = () => {
    const svg = document.getElementById('qr-ticket-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${confirmation.registrationCode}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Ticket downloaded!');
  };

  return (
    <AnimatePresence>
      <motion.div
        className="ef-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="ef-ticket-modal"
          initial={{ scale: 0.85, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="ef-ticket-modal__header">
            <CheckCircle2 size={28} className="ef-ticket-modal__check" />
            <div>
              <p className="eventforge-eyebrow">Registration Confirmed!</p>
              <h2>{event?.name}</h2>
            </div>
            <button type="button" className="ef-modal-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Ticket body */}
          <div className="ef-ticket-body">
            {/* Left: details */}
            <div className="ef-ticket-details">
              <div className="ef-ticket-field">
                <span className="ef-ticket-label">Ticket Type</span>
                <span className="ef-ticket-value">{confirmation.ticket?.name || 'General'}</span>
              </div>
              <div className="ef-ticket-field">
                <span className="ef-ticket-label">Registration Code</span>
                <span className="ef-ticket-value ef-ticket-code">{confirmation.registrationCode}</span>
              </div>
              <div className="ef-ticket-field">
                <span className="ef-ticket-label">Status</span>
                <span className={`eventforge-status eventforge-status--${confirmation.status === 'CONFIRMED' ? 'published' : 'draft'}`}>
                  {confirmation.status}
                </span>
              </div>
              <div className="ef-ticket-field">
                <span className="ef-ticket-label">Quantity</span>
                <span className="ef-ticket-value">{confirmation.quantity} ticket(s)</span>
              </div>
              <div className="ef-ticket-field">
                <span className="ef-ticket-label">Total Paid</span>
                <span className="ef-ticket-value ef-ticket-amount">
                  {formatCurrency(confirmation.totalAmount, confirmation.currency)}
                </span>
              </div>
              {confirmation.attendeeDetails?.fullName && (
                <div className="ef-ticket-field">
                  <span className="ef-ticket-label">Attendee</span>
                  <span className="ef-ticket-value">{confirmation.attendeeDetails.fullName}</span>
                </div>
              )}
            </div>

            {/* Right: QR code */}
            <div className="ef-ticket-qr">
              <div className="ef-qr-wrapper">
                <QRCodeSVG
                  id="qr-ticket-svg"
                  value={qrValue}
                  size={160}
                  bgColor="transparent"
                  fgColor="currentColor"
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="ef-qr-caption">Scan at entry</p>
            </div>
          </div>

          {/* Perforated divider */}
          <div className="ef-ticket-perforation" aria-hidden="true" />

          {/* Footer actions */}
          <div className="ef-ticket-modal__footer">
            <Button variant="secondary" onClick={handleDownload}>
              <Download size={15} aria-hidden="true" /> Download Ticket
            </Button>
            <Button onClick={onViewRegistrations}>
              <TicketIcon size={15} aria-hidden="true" /> My Registrations
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Main RegisterPage ──────────────────────────────────────────────── */
export function RegisterPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ticketId, setTicketId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [attendeeDetails, setAttendeeDetails] = useState(emptyDetails);
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const firstFieldRef = useRef(null);

  const [allTickets, setAllTickets] = useState([]);  // all tickets incl. sold-out
  const selectedTicket = useMemo(() => tickets.find((t) => t._id === ticketId) || null, [tickets, ticketId]);
  const subtotal = selectedTicket ? selectedTicket.price * quantity : 0;
  const total = subtotal;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventResponse, ticketsResponse] = await Promise.all([getEvent(eventId), getEventTickets(eventId)]);
        setEvent(eventResponse.data);
        const active = ticketsResponse.data.filter((t) => t.active);
        setAllTickets(active);
        // Only selectable tickets have seats remaining
        setTickets(active.filter((t) => t.remainingCount > 0));
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
    setAttendeeDetails((curr) => ({ ...curr, fullName: user.name || '', email: user.email || '' }));
  }, [user]);

  // auto-select first ticket
  useEffect(() => {
    if (tickets.length === 1 && !ticketId) setTicketId(tickets[0]._id);
  }, [tickets]);

  // Focus first editable field after page load
  useEffect(() => {
    if (!loading && firstFieldRef.current) firstFieldRef.current.focus();
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await createRegistration(eventId, {
        ticketId,
        quantity,
        couponCode: couponCode.trim() || undefined,
        attendeeDetails: { ...attendeeDetails, email: attendeeDetails.email || user?.email },
      });
      setConfirmation(response.data);
      toast.success('Registration successful! 🎉');
    } catch (requestError) {
      setError(requestError.message || 'Registration could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="eventforge-loading-panel">Loading registration form…</div>;
  if (error && !event)
    return (
      <div className="eventforge-error-panel">
        <strong>Registration unavailable.</strong>
        <p>{error}</p>
        <Link to={`/events/${eventId}`} className="eventforge-primary-link">Back to event</Link>
      </div>
    );

  return (
    <div className="eventforge-event-page eventforge-page--form">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <div>
          <p className="eventforge-eyebrow">Register for event</p>
          <h1>{event?.name || 'EVENT REGISTRATION'}</h1>
        </div>
        <Link to={`/events/${eventId}`} className="eventforge-primary-link">
          <ArrowLeft size={15} aria-hidden="true" /> Back to event
        </Link>
      </header>

      {!allTickets.length ? (
        <div className="eventforge-form-panel eventforge-event-form">
          <div className="ef-no-tickets">
            <QrCode size={48} strokeWidth={1.2} style={{ opacity: 0.25 }} />
            <h2>No Tickets Yet</h2>
            <p>The organizer has not added any tickets for this event yet. Please check back closer to the event date.</p>
          </div>
          <div className="eventforge-form-actions">
            <Link to={`/events/${eventId}`} className="eventforge-button eventforge-button--secondary">Back to event</Link>
          </div>
        </div>
      ) : !tickets.length && allTickets.length > 0 ? (
        <div className="eventforge-form-panel eventforge-event-form">
          <div className="ef-no-tickets">
            <QrCode size={48} strokeWidth={1.2} style={{ opacity: 0.25 }} />
            <h2>All Tickets Sold Out</h2>
            <p>All available tickets for this event have been sold. Please check back for cancellations.</p>
            <div className="ef-soldout-list">
              {allTickets.map((t) => (
                <div key={t._id} className="ef-soldout-badge">
                  <span>{t.name}</span>
                  <span className="ef-soldout-tag">SOLD OUT</span>
                </div>
              ))}
            </div>
          </div>
          <div className="eventforge-form-actions">
            <Link to={`/events/${eventId}`} className="eventforge-button eventforge-button--secondary">Back to event</Link>
          </div>
        </div>
      ) : (
        <form className="eventforge-form-panel eventforge-event-form ef-register-form" onSubmit={handleSubmit} noValidate>

          {/* ── Step 1: Ticket Selection ── */}
          <fieldset className="ef-form-section">
            <legend className="ef-form-section__title">
              <span className="ef-step-badge">1</span> Select Ticket
            </legend>

            <div className="ef-ticket-grid">
              {tickets.map((ticket) => (
                <label
                  key={ticket._id}
                  className={`ef-ticket-option ${ticketId === ticket._id ? 'ef-ticket-option--selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="ticketId"
                    value={ticket._id}
                    checked={ticketId === ticket._id}
                    onChange={(e) => setTicketId(e.target.value)}
                    className="ef-ticket-option__radio"
                  />
                  <div className="ef-ticket-option__body">
                    <div className="ef-ticket-option__top">
                      <strong>{ticket.name}</strong>
                      <span className="ef-ticket-option__price">
                        {ticket.price === 0 ? 'FREE' : formatCurrency(ticket.price, ticket.currency)}
                      </span>
                    </div>
                    {ticket.description && <p className="ef-ticket-option__desc">{ticket.description}</p>}
                    <span className="ef-ticket-option__remaining">{ticket.remainingCount} seats left</span>
                  </div>
                </label>
              ))}
            </div>

            {selectedTicket && (
              <label className="eventforge-field ef-quantity-field">
                <span>Quantity</span>
                <div className="ef-qty-control">
                  <button
                    type="button"
                    className="ef-qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >−</button>
                  <input
                    className="eventforge-input ef-qty-input"
                    type="number"
                    min="1"
                    max={selectedTicket?.maxPerAttendee || 10}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  />
                  <button
                    type="button"
                    className="ef-qty-btn"
                    onClick={() => setQuantity((q) => Math.min(selectedTicket?.maxPerAttendee || 10, q + 1))}
                    aria-label="Increase quantity"
                  >+</button>
                </div>
              </label>
            )}
          </fieldset>

          {/* ── Step 2: Attendee Details ── */}
          <fieldset className="ef-form-section">
            <legend className="ef-form-section__title">
              <span className="ef-step-badge">2</span> Your Details
            </legend>
            <div className="eventforge-form-grid">
              <label className="eventforge-field">
                <span>Full Name *</span>
                <input
                  ref={firstFieldRef}
                  className="eventforge-input"
                  value={attendeeDetails.fullName}
                  onChange={(e) => setAttendeeDetails((curr) => ({ ...curr, fullName: e.target.value }))}
                  placeholder="Your full name"
                  required
                />
              </label>
              <label className="eventforge-field">
                <span>Email *</span>
                <input
                  className="eventforge-input"
                  type="email"
                  value={attendeeDetails.email}
                  onChange={(e) => setAttendeeDetails((curr) => ({ ...curr, email: e.target.value }))}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label className="eventforge-field">
                <span>Phone</span>
                <input
                  className="eventforge-input"
                  type="tel"
                  value={attendeeDetails.phone}
                  onChange={(e) => setAttendeeDetails((curr) => ({ ...curr, phone: e.target.value }))}
                  placeholder="+91 00000 00000"
                />
              </label>
              <label className="eventforge-field">
                <span>Coupon Code</span>
                <input
                  className="eventforge-input"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Optional discount code"
                />
              </label>
            </div>
          </fieldset>

          {/* ── Step 3: Summary ── */}
          {selectedTicket && (
            <div className="ef-form-section ef-order-summary">
              <p className="ef-form-section__title"><span className="ef-step-badge">3</span> Order Summary</p>
              <div className="eventforge-summary-card">
                <div>
                  <span>{selectedTicket.name} × {quantity}</span>
                  <strong>{formatCurrency(subtotal, selectedTicket.currency)}</strong>
                </div>
                {couponCode && (
                  <div>
                    <span>Coupon ({couponCode})</span>
                    <strong>—</strong>
                  </div>
                )}
                <div className="ef-summary-total">
                  <span>Total</span>
                  <strong>{formatCurrency(total, selectedTicket.currency)}</strong>
                </div>
              </div>
            </div>
          )}

          {error && <p className="eventforge-form-error" role="alert">{error}</p>}

          <div className="eventforge-form-actions">
            <Link to={`/events/${eventId}`} className="eventforge-button eventforge-button--secondary">
              Cancel
            </Link>
            <Button type="submit" disabled={submitting || !selectedTicket} id="register-submit-btn">
              <CreditCard size={15} aria-hidden="true" />
              {submitting ? 'Registering…' : 'Complete Registration'}
            </Button>
          </div>
        </form>
      )}

      {/* QR Ticket Modal */}
      {confirmation && (
        <QRTicketModal
          confirmation={confirmation}
          event={event}
          onClose={() => {
            setConfirmation(null);
            navigate(`/events/${eventId}`);
          }}
          onViewRegistrations={() => navigate('/my-registrations')}
        />
      )}
    </div>
  );
}
