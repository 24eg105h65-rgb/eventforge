import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { approveRegistration, cancelRegistration, getEventRegistrations, updateRegistration } from '../../services/phase5Service';

const formatCurrency = (value, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);

export function OrganizerRegistrationsPage() {
  const { eventId } = useParams();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadRegistrations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getEventRegistrations(eventId, statusFilter === 'all' ? {} : { status: statusFilter });
      setRegistrations(response.data);
    } catch (requestError) {
      setError(requestError.message || 'Registrations could not be loaded.');
    } finally {
      setLoading(false);
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
      setRegistrations((current) => current.map((registration) => registration._id === registrationId ? response.data : registration));
    } catch (requestError) {
      setError(requestError.message || 'Registration could not be updated.');
    } finally {
      setUpdatingId('');
    }
  };

  const statuses = useMemo(() => ['all', 'PENDING', 'CONFIRMED', 'WAITLISTED', 'REJECTED', 'CANCELLED'], []);

  if (loading) return <div className="eventforge-loading-panel">Loading registrations…</div>;
  if (error && !registrations.length) return <div className="eventforge-error-panel"><strong>Registrations unavailable.</strong><p>{error}</p><Link to={`/events/${eventId}`} className="eventforge-primary-link">Back to event</Link></div>;

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <div>
          <p className="eventforge-eyebrow">Organizer registrations</p>
          <h1>REGISTRATIONS</h1>
        </div>
        <Link to={`/events/${eventId}`} className="eventforge-primary-link"><ArrowLeft size={15} aria-hidden="true" /> Event</Link>
      </header>

      <section className="eventforge-event-toolbar">
        <label className="eventforge-field eventforge-field--compact">
          <span>Status</span>
          <select className="eventforge-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statuses.map((status) => <option key={status} value={status}>{status === 'all' ? 'All statuses' : status}</option>)}
          </select>
        </label>
      </section>

      <div className="eventforge-table-wrap">
        <table className="eventforge-table">
          <thead><tr><th>Code</th><th>Attendee</th><th>Ticket</th><th>Qty</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {registrations.map((registration) => (
              <tr key={registration._id}>
                <td><strong>{registration.registrationCode}</strong></td>
                <td>{registration.attendee?.name || registration.attendeeDetails?.fullName || 'Unknown'}<br /><small>{registration.attendee?.email}</small></td>
                <td>{registration.ticket?.name}<br /><small>{registration.ticket?.type}</small></td>
                <td>{registration.quantity}</td>
                <td>{formatCurrency(registration.totalAmount, registration.currency)}</td>
                <td><span className={`eventforge-status eventforge-status--${registration.status === 'CONFIRMED' ? 'published' : registration.status === 'CANCELLED' ? 'cancelled' : 'draft'}`}>{registration.status}</span></td>
                <td className="eventforge-table__actions">
                  {registration.status !== 'CONFIRMED' && registration.status !== 'CANCELLED' ? <Button type="button" variant="secondary" onClick={() => handleStatusChange(registration._id, 'approve')} disabled={updatingId === registration._id}><Check size={15} aria-hidden="true" /> {updatingId === registration._id ? 'Approving…' : 'Approve'}</Button> : null}
                  {registration.status !== 'REJECTED' && registration.status !== 'CANCELLED' ? <Button type="button" variant="secondary" onClick={() => handleStatusChange(registration._id, 'reject')} disabled={updatingId === registration._id}><X size={15} aria-hidden="true" /> {updatingId === registration._id ? 'Rejecting…' : 'Reject'}</Button> : null}
                  {registration.status !== 'CANCELLED' ? <Button type="button" variant="secondary" onClick={() => handleStatusChange(registration._id, 'cancel')} disabled={updatingId === registration._id}><X size={15} aria-hidden="true" /> {updatingId === registration._id ? 'Cancelling…' : 'Cancel'}</Button> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!registrations.length ? <div className="eventforge-empty-state"><h2>No registrations</h2><p>No registrations match this filter.</p></div> : null}
    </div>
  );
}
