import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { createTicket, getTicket, updateTicket } from '../../services/phase5Service';

const defaultTicket = {
  name: '',
  description: '',
  type: 'PAID',
  price: '',
  currency: 'INR',
  capacity: '',
  saleStart: '',
  saleEnd: '',
  active: true,
  requiresApproval: false,
  maxPerAttendee: 1,
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export function TicketFormPage() {
  const { eventId, ticketId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultTicket);
  const [loading, setLoading] = useState(Boolean(ticketId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ticketId) return;

    getTicket(ticketId)
      .then((response) => setForm({
        ...response.data,
        price: response.data.price ?? '',
        capacity: response.data.capacity ?? '',
        maxPerAttendee: response.data.maxPerAttendee ?? 1,
        saleStart: formatDateTime(response.data.saleStart),
        saleEnd: formatDateTime(response.data.saleEnd),
      }))
      .catch((requestError) => setError(requestError.message || 'Ticket could not be loaded.'))
      .finally(() => setLoading(false));
  }, [ticketId]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        capacity: Number(form.capacity),
        maxPerAttendee: Number(form.maxPerAttendee),
        saleStart: form.saleStart || null,
        saleEnd: form.saleEnd || null,
        active: Boolean(form.active),
        requiresApproval: Boolean(form.requiresApproval),
      };

      const response = ticketId ? await updateTicket(ticketId, payload) : await createTicket(eventId, payload);
      navigate(`/events/${eventId}/tickets/${ticketId || response.data._id}`);
    } catch (requestError) {
      setError(requestError.message || 'Ticket could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="eventforge-loading-panel">Loading ticket…</div>;

  return (
    <div className="eventforge-event-page eventforge-page--form">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <div>
          <p className="eventforge-eyebrow">{ticketId ? 'Edit ticket' : 'Create ticket'}</p>
          <h1>{ticketId ? 'UPDATE TICKET' : 'NEW TICKET'}</h1>
        </div>
        <Link to={`/events/${eventId}/tickets`} className="eventforge-primary-link"><ArrowLeft size={15} aria-hidden="true" /> Back to tickets</Link>
      </header>

      <section className="eventforge-form-panel">
        <form className="eventforge-event-form" onSubmit={handleSubmit}>
          <div className="eventforge-form-grid eventforge-form-grid--main">
            <label className="eventforge-field">
              <span>Ticket name</span>
              <input className="eventforge-input" value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
            </label>
            <label className="eventforge-field">
              <span>Type</span>
              <select className="eventforge-input" value={form.type} onChange={(event) => updateField('type', event.target.value)}>
                <option value="PAID">Paid</option><option value="FREE">Free</option><option value="VIP">VIP</option><option value="EARLY_BIRD">Early bird</option><option value="STUDENT">Student</option><option value="CORPORATE">Corporate</option><option value="GROUP">Group</option><option value="CUSTOM">Custom</option>
              </select>
            </label>
          </div>

          <label className="eventforge-field">
            <span>Description</span>
            <textarea className="eventforge-textarea" value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Describe what this ticket includes." />
          </label>

          <div className="eventforge-form-grid">
            <label className="eventforge-field">
              <span>Price</span>
              <input className="eventforge-input" type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField('price', event.target.value)} required />
            </label>
            <label className="eventforge-field">
              <span>Currency</span>
              <input className="eventforge-input" value={form.currency} maxLength="10" onChange={(event) => updateField('currency', event.target.value.toUpperCase())} />
            </label>
            <label className="eventforge-field">
              <span>Capacity</span>
              <input className="eventforge-input" type="number" min="1" step="1" value={form.capacity} onChange={(event) => updateField('capacity', event.target.value)} required />
            </label>
            <label className="eventforge-field">
              <span>Maximum per attendee</span>
              <input className="eventforge-input" type="number" min="1" max="100" value={form.maxPerAttendee} onChange={(event) => updateField('maxPerAttendee', event.target.value)} />
            </label>
            <label className="eventforge-field">
              <span>Sale start</span>
              <input className="eventforge-input" type="datetime-local" value={form.saleStart} onChange={(event) => updateField('saleStart', event.target.value)} />
            </label>
            <label className="eventforge-field">
              <span>Sale end</span>
              <input className="eventforge-input" type="datetime-local" value={form.saleEnd} onChange={(event) => updateField('saleEnd', event.target.value)} />
            </label>
          </div>

          <div className="eventforge-form-grid">
            <label className="eventforge-checkbox">
              <input type="checkbox" checked={form.active} onChange={(event) => updateField('active', event.target.checked)} />
              <span>Ticket is active</span>
            </label>
            <label className="eventforge-checkbox">
              <input type="checkbox" checked={form.requiresApproval} onChange={(event) => updateField('requiresApproval', event.target.checked)} />
              <span>Requires organizer approval</span>
            </label>
          </div>

          {error ? <p className="eventforge-form-error" role="alert">{error}</p> : null}
          <div className="eventforge-form-actions">
            <Link to={`/events/${eventId}/tickets`} className="eventforge-button eventforge-button--secondary">Cancel</Link>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : ticketId ? 'Save changes' : 'Create ticket'}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
