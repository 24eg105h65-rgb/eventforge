import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, CreditCard, QrCode, Ticket as TicketIcon, X, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getMyRegistrations } from '../../services/phase5Service';

const formatCurrency = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);
const formatDate = (value) =>
  new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const STATUS_COLORS = {
  CONFIRMED: 'published',
  CANCELLED: 'cancelled',
  REJECTED: 'cancelled',
  PENDING: 'draft',
  WAITLISTED: 'draft',
};

/* ── QR Ticket Viewer ──────────────────────────────────────────── */
function QRTicketViewer({ registration, onClose }) {
  const qrValue = JSON.stringify({
    code: registration.registrationCode,
    event: registration.event?.name,
    ticket: registration.ticket?.name,
    qty: registration.quantity,
    status: registration.status,
  });

  const handleDownload = () => {
    const svg = document.getElementById('qr-view-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${registration.registrationCode}.svg`;
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
          <div className="ef-ticket-modal__header">
            <TicketIcon size={26} style={{ color: '#a5f3fc', flexShrink: 0 }} />
            <div>
              <p className="eventforge-eyebrow">Your Ticket</p>
              <h2>{registration.event?.name}</h2>
            </div>
            <button type="button" className="ef-modal-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="ef-ticket-body">
            <div className="ef-ticket-details">
              <div className="ef-ticket-field">
                <span className="ef-ticket-label">Registration Code</span>
                <span className="ef-ticket-value ef-ticket-code">{registration.registrationCode}</span>
              </div>
              <div className="ef-ticket-field">
                <span className="ef-ticket-label">Ticket</span>
                <span className="ef-ticket-value">{registration.ticket?.name} · {registration.ticket?.type}</span>
              </div>
              <div className="ef-ticket-field">
                <span className="ef-ticket-label">Status</span>
                <span className={`eventforge-status eventforge-status--${STATUS_COLORS[registration.status] || 'draft'}`}>
                  {registration.status}
                </span>
              </div>
              <div className="ef-ticket-field">
                <span className="ef-ticket-label">Quantity</span>
                <span className="ef-ticket-value">{registration.quantity} ticket(s)</span>
              </div>
              <div className="ef-ticket-field">
                <span className="ef-ticket-label">Total Paid</span>
                <span className="ef-ticket-value ef-ticket-amount">
                  {formatCurrency(registration.totalAmount, registration.currency)}
                </span>
              </div>
              <div className="ef-ticket-field">
                <span className="ef-ticket-label">Registered</span>
                <span className="ef-ticket-value">{formatDate(registration.registeredAt)}</span>
              </div>
            </div>

            <div className="ef-ticket-qr">
              <div className="ef-qr-wrapper">
                <QRCodeSVG
                  id="qr-view-svg"
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

          <div className="ef-ticket-perforation" aria-hidden="true" />

          <div className="ef-ticket-modal__footer">
            <button type="button" className="eventforge-button eventforge-button--secondary" onClick={handleDownload}>
              <Download size={14} style={{ marginRight: '0.5rem' }} /> Download
            </button>
            <button type="button" className="eventforge-button eventforge-button--secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Main MyRegistrationsPage ──────────────────────────────────── */
export function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    getMyRegistrations()
      .then((response) => setRegistrations(response.data))
      .catch((requestError) => setError(requestError.message || 'Registrations could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="eventforge-loading-panel">Loading registrations…</div>;
  if (error)
    return (
      <div className="eventforge-error-panel">
        <strong>Registrations unavailable.</strong>
        <p>{error}</p>
        <Link to="/events" className="eventforge-primary-link">Browse events</Link>
      </div>
    );

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header">
        <div>
          <p className="eventforge-eyebrow">My registrations</p>
          <h1>MY REGISTRATIONS</h1>
          <p className="eventforge-page-subtitle">Your ticket bookings and registration status.</p>
        </div>
        <Link to="/events" className="eventforge-primary-link">
          <ArrowLeft size={15} aria-hidden="true" /> Events
        </Link>
      </header>

      {registrations.length ? (
        <div className="eventforge-resource-grid">
          {registrations.map((registration) => (
            <article key={registration._id} className="eventforge-resource-card">
              <div className="eventforge-resource-card__icon">
                <TicketIcon size={20} aria-hidden="true" />
              </div>
              <div className="eventforge-resource-card__content">
                <h2>{registration.event?.name}</h2>
                <p>{registration.ticket?.name} · {registration.attendeeDetails?.fullName || 'Attendee'}</p>
                <div className="eventforge-ticket-meta">
                  <span><strong>{registration.registrationCode}</strong> code</span>
                  <span><strong>{registration.quantity}</strong> ticket(s)</span>
                  <span><strong>{formatCurrency(registration.totalAmount, registration.currency)}</strong> total</span>
                </div>
                <div className="eventforge-resource-card__status">
                  <span className={`eventforge-status eventforge-status--${STATUS_COLORS[registration.status] || 'draft'}`}>
                    {registration.status}
                  </span>
                  <span><CalendarDays size={13} aria-hidden="true" /> {formatDate(registration.registeredAt)}</span>
                </div>
              </div>
              <div className="eventforge-resource-card__actions">
                <button
                  type="button"
                  className="eventforge-button eventforge-button--secondary"
                  onClick={() => setSelectedTicket(registration)}
                  aria-label={`View QR ticket for ${registration.event?.name}`}
                  style={{ gap: '0.5rem' }}
                >
                  <QrCode size={14} aria-hidden="true" /> View Ticket
                </button>
                <Link to={`/events/${registration.event?._id}`} className="eventforge-primary-link">
                  <CreditCard size={15} aria-hidden="true" /> Event
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="eventforge-empty-state">
          <h2>No registrations yet</h2>
          <p>Choose an event and register for a ticket.</p>
          <Link to="/events" className="eventforge-primary-link">Browse events</Link>
        </div>
      )}

      {selectedTicket && (
        <QRTicketViewer
          registration={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
