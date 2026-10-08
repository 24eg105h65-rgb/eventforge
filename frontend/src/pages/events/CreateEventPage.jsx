import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { EventForm } from '../../components/events/EventForm';
import { createEvent } from '../../services/eventService';

export function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError('');
    try {
      const response = await createEvent(payload);
      toast.success('Event created.');
      navigate(`/events/${response.event._id}`);
    } catch (requestError) {
      setError(requestError.message || 'Event could not be created.');
      toast.error(requestError.message || 'Event could not be created.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eventforge-event-page eventforge-event-page--form">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <Link to="/events" className="eventforge-back-link"><ArrowLeft size={15} aria-hidden="true" /> Events</Link>
        <div>
          <p className="eventforge-eyebrow">Create event</p>
          <h1>BUILD THE MOMENT</h1>
        </div>
      </header>
      <section className="eventforge-form-panel">
        <EventForm initialValues={{}} onSubmit={handleSubmit} submitLabel="Create event" loading={loading} submitError={error} />
      </section>
    </div>
  );
}
