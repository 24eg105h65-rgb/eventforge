import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { getVenues } from '../../services/venueService';
import { createSession } from '../../services/sessionService';

const DEFAULT_FORM = {
  title: '', description: '', sessionType: 'talk', venue: '', speakers: '', startTime: '', endTime: '', capacity: '', status: 'draft', track: '', tags: '', materials: '', livestreamUrl: '', recordingUrl: '',
};

export function CreateSessionPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVenues = async () => {
      setLoading(true);
      try {
        const response = await getVenues(eventId);
        setVenues(Array.isArray(response.data) ? response.data : []);
        if (response.data?.[0]?._id) setForm((current) => ({ ...current, venue: response.data[0]._id }));
      } catch (requestError) {
        setError(requestError.message || 'Unable to load venues.');
      } finally {
        setLoading(false);
      }
    };
    loadVenues();
  }, [eventId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        venue: form.venue,
        speakers: form.speakers.split(',').map((item) => item.trim()).filter(Boolean),
        capacity: form.capacity ? Number(form.capacity) : undefined,
        tags: form.tags.split(',').map((item) => item.trim()).filter(Boolean),
        materials: form.materials.split(',').map((item) => item.trim()).filter(Boolean),
      };
      const response = await createSession(eventId, payload);
      toast.success('Session created.');
      navigate(`/events/${eventId}/sessions/${response.data._id}`);
    } catch (requestError) {
      const message = requestError.message || 'Session could not be created.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="eventforge-loading-panel">Loading venue options…</div>;

  return (
    <div className="eventforge-event-page eventforge-event-page--form">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <Link to={`/events/${eventId}/sessions`} className="eventforge-back-link"><ArrowLeft size={15} aria-hidden="true" /> Sessions</Link>
        <div>
          <p className="eventforge-eyebrow">Create session</p>
          <h1>PLAN THE MOMENT</h1>
        </div>
      </header>
      <section className="eventforge-form-panel">
        <form className="eventforge-form" onSubmit={handleSubmit}>
          <div className="eventforge-form-grid">
            <label className="eventforge-field eventforge-field--full"><span>Title</span><input name="title" value={form.title} onChange={handleChange} required /></label>
            <label className="eventforge-field eventforge-field--full"><span>Description</span><textarea name="description" value={form.description} onChange={handleChange} rows="3" /></label>
            <label className="eventforge-field"><span>Venue</span><select name="venue" value={form.venue} onChange={handleChange} required>
              <option value="">Select a venue</option>
              {venues.map((venue) => <option key={venue._id} value={venue._id}>{venue.name}</option>)}
            </select></label>
            <label className="eventforge-field"><span>Session type</span><select name="sessionType" value={form.sessionType} onChange={handleChange}><option value="keynote">Keynote</option><option value="workshop">Workshop</option><option value="panel">Panel</option><option value="talk">Talk</option><option value="networking">Networking</option><option value="breakout">Breakout</option><option value="fireside-chat">Fireside chat</option><option value="other">Other</option></select></label>
            <label className="eventforge-field"><span>Status</span><select name="status" value={form.status} onChange={handleChange}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
            <label className="eventforge-field"><span>Capacity</span><input type="number" name="capacity" min="1" value={form.capacity} onChange={handleChange} /></label>
            <label className="eventforge-field"><span>Speakers</span><input name="speakers" value={form.speakers} onChange={handleChange} placeholder="Speaker IDs separated by commas" /></label>
            <label className="eventforge-field"><span>Track</span><input name="track" value={form.track} onChange={handleChange} /></label>
            <label className="eventforge-field"><span>Start time</span><input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} required /></label>
            <label className="eventforge-field"><span>End time</span><input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} required /></label>
            <label className="eventforge-field "><span>Tags</span><input name="tags" value={form.tags} onChange={handleChange} placeholder="welcome, technology" /></label>
            <label className="eventforge-field"><span>Materials</span><input name="materials" value={form.materials} onChange={handleChange} placeholder="slides, notes" /></label>
            <label className="eventforge-field eventforge-field--full"><span>Livestream URL</span><input name="livestreamUrl" value={form.livestreamUrl} onChange={handleChange} /></label>
            <label className="eventforge-field eventforge-field--full"><span>Recording URL</span><input name="recordingUrl" value={form.recordingUrl} onChange={handleChange} /></label>
          </div>
          {error ? <p className="eventforge-form-error" role="alert">{error}</p> : null}
          <div className="eventforge-form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate(`/events/${eventId}/sessions`)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create session'}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
