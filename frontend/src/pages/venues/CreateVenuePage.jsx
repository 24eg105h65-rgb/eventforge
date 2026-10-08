import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { createVenue } from '../../services/venueService';

const normalize = (value) => value ? value.trim() : '';

export function CreateVenuePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', description: '', building: '', floor: '', roomNumber: '', address: '', capacity: 50, facilities: '', seatingType: 'theatre', isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        name: normalize(form.name),
        description: normalize(form.description),
        building: normalize(form.building),
        floor: normalize(form.floor),
        roomNumber: normalize(form.roomNumber),
        address: normalize(form.address),
        capacity: Number(form.capacity),
        facilities: form.facilities.split(',').map((item) => item.trim()).filter(Boolean),
      };
      const response = await createVenue(eventId, payload);
      toast.success('Venue created.');
      navigate(`/events/${eventId}/venues/${response.venue._id}`);
    } catch (requestError) {
      const message = requestError.message || 'Venue could not be created.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="eventforge-event-page eventforge-event-page--form">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <Link to={`/events/${eventId}/venues`} className="eventforge-back-link"><ArrowLeft size={15} aria-hidden="true" /> Venues</Link>
        <div>
          <p className="eventforge-eyebrow">Create venue</p>
          <h1>ADD A ROOM</h1>
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
            <Button type="button" variant="secondary" onClick={() => navigate(`/events/${eventId}/venues`)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create venue'}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
