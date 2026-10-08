import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EventForm } from '../../components/events/EventForm';
import { getEvent, updateEvent } from '../../services/eventService';

export function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      try {
        const response = await getEvent(id);
        setEvent(response.data);
      } catch (requestError) {
        setError(requestError.message || 'Event could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError('');
    try {
      await updateEvent(id, payload);
      toast.success('Event updated.');
      navigate(`/events/${id}`);
    } catch (requestError) {
      setError(requestError.message || 'Event could not be updated.');
      toast.error(requestError.message || 'Event could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="eventforge-loading-panel">Loading event…</div>;
  if (error) return <div className="eventforge-error-panel"><strong>Event unavailable.</strong><p>{error}</p><Link to="/events" className="eventforge-primary-link">Return to events</Link></div>;

  return (
    <div className="eventforge-event-page eventforge-event-page--form">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <Link to={`/events/${id}`} className="eventforge-back-link"><ArrowLeft size={15} aria-hidden="true" /> Event</Link>
        <div>
          <p className="eventforge-eyebrow">Edit event</p>
          <h1>UPDATE THE MOMENT</h1>
        </div>
      </header>
      <section className="eventforge-form-panel">
        <EventForm initialValues={event} onSubmit={handleSubmit} submitLabel="Save changes" loading={saving} submitError={error} mode="edit" />
      </section>
    </div>
  );
}
