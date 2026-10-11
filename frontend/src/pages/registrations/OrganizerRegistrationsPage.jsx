import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, RefreshCw, Users, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { approveRegistration, cancelRegistration, getEventRegistrations, updateRegistration } from '../../services/phase5Service';

const formatCurrency = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);

const STATUS_COLORS = {
  CONFIRMED: 'published',
  CANCELLED: 'cancelled',
  REJECTED: 'cancelled',
  PENDING: 'draft',
  WAITLISTED: 'draft',
};

export function OrganizerRegistrationsPage() {
  const { eventId } = useParams();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadRegistrations = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await getEventRegistrations(eventId, statusFilter === 'all' ? {} : { status: statusFilter });
      setRegistrations(response.data);
    } catch (requestError) {
      setError(requestError.message || 'Registrations could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [eventId, statusFilter]);

  const handleStatusChange = async (registrationId, action) => {
    setUpdatingId(registrationId);
    try {
      let response;
      if (action === 'approve') response = await approveRegistration(registrationId);
      else if (action === 'reject') response = await updateRegistration(registrationId, { status: 'REJECTED' });
      else response = await cancelRegistration(registrationId);
      setRegistrations((current) =>
        current.map((reg) => (reg._id === registrationId ? response.data : reg)),
      );
    } catch (requestError) {
      setError(requestError.message || 'Registration could not be updated.');
    } finally {
      setUpdatingId('');
    }
  };

  const statuses = useMemo(() => ['all', 'PENDING', 'CONFIRMED', 'WAITLISTED', 'REJECTED', 'CANCELLED'], []);

  /* ── Derived stats ─────────────────────────── */
  const stats = useMemo(() => {
    const all = registrations;
    // Total unique attendees (confirmed only)
    const confirmedRegs = all.filter((r) => r.status === 'CONFIRMED');
    const totalAttendees = confirmedRegs.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
    const totalRevenue = confirmedRegs.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);
    const pendingCount = all.filter((r) => r.status === 'PENDING').length;
    return { totalAttendees, totalRevenue, pendingCount, totalRegistrations: all.length };
  }, [registrations]);

  if (loading) return <div className="eventforge-loading-panel">Loading registrations…</div>;
  if (error && !registrations.length)
    return (
      <div className="eventforge-error-panel">
        <strong>Registrations unavailable.</strong>
        <p>{error}</p>
        <Link to={`/events/${eventId}`} className="eventforge-primary-link">Back to event</Link>
      </div>
    );

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <div>
          <p className="eventforge-eyebrow">Organizer view</p>
          <h1>REGISTRATIONS</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="ef-icon-btn"
            onClick={() => loadRegistrations(true)}
            disabled={refreshing}
            title="Refresh"
            aria-label="Refresh registrations"
          >
            <RefreshCw size={16} className={refreshing ? 'ef-spin' : ''} />
          </button>
          <Link to={`/events/${eventId}`} className="eventforge-primary-link">
            <ArrowLeft size={15} aria-hidden="true" /> Event
          </Link>
        </div>
      </header>

      {/* ── Attendee Count Stats ── */}
      <motion.div
        className="ef-reg-stats"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="ef-reg-stat-card ef-reg-stat-card--highlight">
          <Users size={22} className="ef-reg-stat-icon" />
          <div>
            <strong className="ef-reg-stat-value">{stats.totalAttendees}</strong>
            <span className="ef-reg-stat-label">Total Attendees</span>
            <small>(Confirmed tickets)</small>
          </div>
        </div>
        <div className="ef-reg-stat-card">
          <strong className="ef-reg-stat-value">{stats.totalRegistrations}</strong>
          <span className="ef-reg-stat-label">Total Registrations</span>
        </div>
        <div className="ef-reg-stat-card">
          <strong className="ef-reg-stat-value ef-pending-value">{stats.pendingCount}</strong>
          <span className="ef-reg-stat-label">Pending Approval</span>
        </div>
        <div className="ef-reg-stat-card">
          <strong className="ef-reg-stat-value ef-revenue-value">
            {formatCurrency(stats.totalRevenue)}
          </strong>
          <span className="ef-reg-stat-label">Total Revenue</span>
          <small>(Confirmed only)</small>
        </div>
      </motion.div>

      {/* ── Filters ── */}
      <section className="eventforge-event-toolbar">
        <label className="eventforge-field eventforge-field--compact">
          <span>Filter by status</span>
          <select
            className="eventforge-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All statuses' : status}
              </option>
            ))}
          </select>
        </label>
        <span className="ef-reg-count-badge">
          {registrations.length} result{registrations.length !== 1 ? 's' : ''}
        </span>
      </section>

      {/* ── Table ── */}
      <div className="eventforge-table-wrap">
        <table className="eventforge-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Attendee</th>
              <th>Ticket</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((registration) => (
              <tr key={registration._id} className={updatingId === registration._id ? 'ef-row-loading' : ''}>
                <td>
                  <strong className="ef-reg-code">{registration.registrationCode}</strong>
                </td>
                <td>
                  <span>{registration.attendee?.name || registration.attendeeDetails?.fullName || 'Unknown'}</span>
                  <br />
                  <small>{registration.attendee?.email || registration.attendeeDetails?.email || '—'}</small>
                </td>
                <td>
                  {registration.ticket?.name}
                  <br />
                  <small>{registration.ticket?.type}</small>
                </td>
                <td>{registration.quantity}</td>
                <td>{formatCurrency(registration.totalAmount, registration.currency)}</td>
                <td>
                  <span className={`eventforge-status eventforge-status--${STATUS_COLORS[registration.status] || 'draft'}`}>
                    {registration.status}
                  </span>
                </td>
                <td className="eventforge-table__actions">
                  {registration.status !== 'CONFIRMED' && registration.status !== 'CANCELLED' && registration.status !== 'REJECTED' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleStatusChange(registration._id, 'approve')}
                      disabled={updatingId === registration._id}
                    >
                      <Check size={14} aria-hidden="true" />
                      {updatingId === registration._id ? 'Approving…' : 'Approve'}
                    </Button>
                  ) : null}
                  {registration.status !== 'REJECTED' && registration.status !== 'CANCELLED' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleStatusChange(registration._id, 'reject')}
                      disabled={updatingId === registration._id}
                    >
                      <X size={14} aria-hidden="true" />
                      {updatingId === registration._id ? 'Rejecting…' : 'Reject'}
                    </Button>
                  ) : null}
                  {registration.status !== 'CANCELLED' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleStatusChange(registration._id, 'cancel')}
                      disabled={updatingId === registration._id}
                    >
                      <X size={14} aria-hidden="true" />
                      {updatingId === registration._id ? 'Cancelling…' : 'Cancel'}
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!registrations.length ? (
        <div className="eventforge-empty-state">
          <h2>No registrations</h2>
          <p>No registrations match this filter.</p>
        </div>
      ) : null}
    </div>
  );
}
