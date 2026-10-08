import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { getVenue, updateVenue } from '../../services/venueService';

export function EditVenuePage() {
  const { eventId, venueId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVenue = async () => {
      setLoading(true);
      try {
        const response = await getVenue(venueId);
        setForm({ ...response.data, facilities: (response.data.facilities || []).join(', ') });
      } catch (requestError) {
        setError(requestError.message || 'Venue could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    loadVenue();
  }, [venueId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateVenue(venueId, {
        ...form,
        capacity: Number(form.capacity),
        facilities: form.facilities.split(',').map((item) => item.trim()).filter(Boolean),
      });
      toast.success('Venue updated.');
      navigate(`/events/${eventId}/venues/${venueId}`);
    } catch (requestError) {
      const message = requestError.message || 'Venue could not be updated.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="eventforge-loading-panel">Loading venue…</div>;
  if (error) return <div className="eventforge-error-panel"><strong>Venue unavailable.</strong><p>{error}</p><Link to={`/events/${eventId}/venues`} className="eventforge-primary-link">Return to venues</Link></div>;
  if (!form) return null;

  return (
    <div className="eventforge-event-page eventforge-event-page--form">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <Link to={`/events/${eventId}/venues/${venueId}`} className="eventforge-back-link"><ArrowLeft size={15} aria-hidden="true" /> Venue</Link>
        <div>
          <p className="eventforge-eyebrow">Edit venue</p>
          <h1>UPDATE THE ROOM</h1>
        </div>
      </header>
      <section className="eventforge-form-panel">
        <form className="eventforge-form" onSubmit={handleSubmit}>
          <div className="eventforge-form-grid">
            <label className="eventforge-field"><span>Name</span><input name="name" value={form.name} onChange={handleChange} required /></label>
            <label className="eventforge-field"><span>Capacity</span><input type="number" name="capacity" min="1" value={form.capacity} onChange={handleChange} required /></label>
            <label className="eventforge-field"><span>Building</span><input name="building" value={form.building} onChange={handleChange} /></label>
            <label className="eventforge-field"><span>Floor</span><input name="floor" value={form.floor} onChange={handleChange} /></label>
            <label className="eventforge-field"><span>Room number</span><input name="roomNumber" value={form.roomNumber} onChange={handleChange} /></label>
            <label className="eventforge-field"><span>Seating type</span><select name="seatingType" value={form.seatingType} onChange={handleChange}><option value="theatre">Theatre</option><option value="classroom">Classroom</option><option value="boardroom">Boardroom</option><option value="u-shape">U-shape</option><option value="banquet">Banquet</option><option value="standing">Standing</option><option value="other">Other</option></select></label>
            <label className="eventforge-field eventforge-field--full"><span>Address</span><input name="address" value={form.address} onChange={handleChange} /></label>
            <label className="eventforge-field eventforge-field--full"><span>Description</span><textarea name="description" value={form.description} onChange={handleChange} rows="4" /></label>
            <label className="eventforge-field eventforge-field--full"><span>Facilities</span><input name="facilities" value={form.facilities} onChange={handleChange} placeholder="projector, microphone, wifi" /></label>
            <label className="eventforge-checkbox"><input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} /> Active venue</label>
          </div>
          {error ? <p className="eventforge-form-error" role="alert">{error}</p> : null}
          <div className="eventforge-form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate(`/events/${eventId}/venues/${venueId}`)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
