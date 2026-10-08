import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { getSession, updateSession } from '../../services/sessionService';
import { getVenues } from '../../services/venueService';

const formatDateTimeLocal = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 16);
};

export function EditSessionPage() {
  const { eventId, sessionId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sessionResponse, venueResponse] = await Promise.all([getSession(sessionId), getVenues(eventId)]);
        const session = sessionResponse.data;
        setForm({
          ...session,
          speakers: (session.speakers || []).join(', '),
          tags: (session.tags || []).join(', '),
          materials: (session.materials || []).join(', '),
          venue: session.venue || '',
          startTime: formatDateTimeLocal(session.startTime),
          endTime: formatDateTimeLocal(session.endTime),
          capacity: session.capacity || '',
        });
        setVenues(Array.isArray(venueResponse.data) ? venueResponse.data : []);
      } catch (requestError) {
        setError(requestError.message || 'Session could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId, sessionId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateSession(sessionId, {
        ...form,
        speakers: form.speakers.split(',').map((item) => item.trim()).filter(Boolean),
        tags: form.tags.split(',').map((item) => item.trim()).filter(Boolean),
        materials: form.materials.split(',').map((item) => item.trim()).filter(Boolean),
        capacity: form.capacity ? Number(form.capacity) : undefined,
      });
      toast.success('Session updated.');
      navigate(`/events/${eventId}/sessions/${sessionId}`);
    } catch (requestError) {
      const message = requestError.message || 'Session could not be updated.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="eventforge-loading-panel">Loading session…</div>;
  if (error) return <div className="eventforge-error-panel"><strong>Session unavailable.</strong><p>{error}</p><Link to={`/events/${eventId}/sessions`} className="eventforge-primary-link">Return to sessions</Link></div>;
  if (!form) return null;

  return (
    <div className="eventforge-event-page eventforge-event-page--form">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <Link to={`/events/${eventId}/sessions/${sessionId}`} className="eventforge-back-link"><ArrowLeft size={15} aria-hidden="true" /> Session</Link>
        <div>
          <p className="eventforge-eyebrow">Edit session</p>
          <h1>UPDATE THE PROGRAM</h1>
        </div>
      </header>
      <section className="eventforge-form-panel">
        <form className="eventforge-form" onSubmit={handleSubmit}>
          <div className="eventforge-form-grid">
            <label className="eventforge-field eventforge-field--full"><span>Title</span><input name="title" value={form.title} onChange={handleChange} required /></label>
            <label className="eventforge-field eventforge-field--full"><span>Description</span><textarea name="description" value={form.description || ''} onChange={handleChange} rows="3" /></label>
            <label className="eventforge-field"><span>Venue</span><select name="venue" value={form.venue} onChange={handleChange} required>
              <option value="">Select a venue</option>
              {venues.map((venue) => <option key={venue._id} value={venue._id}>{venue.name}</option>)}
            </select></label>
            <label className="eventforge-field"><span>Session type</span><select name="sessionType" value={form.sessionType || 'talk'} onChange={handleChange}><option value="keynote">Keynote</option><option value="workshop">Workshop</option><option value="panel">Panel</option><option value="talk">Talk</option><option value="networking">Networking</option><option value="breakout">Breakout</option><option value="fireside-chat">Fireside chat</option><option value="other">Other</option></select></label>
            <label className="eventforge-field"><span>Status</span><select name="status" value={form.status || 'draft'} onChange={handleChange}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
            <label className="eventforge-field"><span>Capacity</span><input type="number" name="capacity" min="1" value={form.capacity} onChange={handleChange} /></label>
            <label className="eventforge-field"><span>Speakers</span><input name="speakers" value={form.speakers} onChange={handleChange} placeholder="Speaker IDs separated by commas" /></label>
            <label className="eventforge-field"><span>Track</span><input name="track" value={form.track || ''} onChange={handleChange} /></label>
            <label className="eventforge-field"><span>Start time</span><input type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} required /></label>
            <label className="eventforge-field"><span>End time</span><input type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} required /></label>
            <label className="eventforge-field"><span>Tags</span><input name="tags" value={form.tags} onChange={handleChange} placeholder="welcome, technology" /></label>
            <label className="eventforge-field"><span>Materials</span><input name="materials" value={form.materials} onChange={handleChange} placeholder="slides, notes" /></label>
            <label className="eventforge-field eventforge-field--full"><span>Livestream URL</span><input name="livestreamUrl" value={form.livestreamUrl || ''} onChange={handleChange} /></label>
            <label className="eventforge-field eventforge-field--full"><span>Recording URL</span><input name="recordingUrl" value={form.recordingUrl || ''} onChange={handleChange} /></label>
          </div>
          {error ? <p className="eventforge-form-error" role="alert">{error}</p> : null}
          <div className="eventforge-form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate(`/events/${eventId}/sessions/${sessionId}`)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
