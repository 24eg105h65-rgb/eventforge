import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { getVenues, deleteVenue } from '../../services/venueService';

const formatCapacity = (value) => `${Number(value || 0).toLocaleString()} guests`;

export function VenuesPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadVenues = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getVenues(eventId);
      setVenues(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load venues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
  }, [eventId]);

  const handleDelete = async (venue) => {
    const confirmed = window.confirm(`Delete ${venue.name}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(venue._id);
    try {
      await deleteVenue(venue._id);
      toast.success('Venue deleted.');
      setVenues((current) => current.filter((item) => item._id !== venue._id));
    } catch (requestError) {
      toast.error(requestError.message || 'Venue could not be deleted.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header">
        <div>
          <Link to={`/events/${eventId}`} className="eventforge-back-link"><ArrowLeft size={15} aria-hidden="true" /> Event</Link>
          <p className="eventforge-eyebrow">Venues</p>
          <h1>ROOMS</h1>
        </div>
        <Button onClick={() => navigate(`/events/${eventId}/venues/new`)}><Plus size={15} aria-hidden="true" /> Add venue</Button>
      </header>

      {loading ? (
        <div className="eventforge-loading-panel" aria-live="polite">Loading venues…</div>
      ) : error ? (
        <div className="eventforge-error-panel" role="alert">
          <strong>Unable to load venues.</strong>
          <p>{error}</p>
          <Button type="button" variant="secondary" onClick={loadVenues}>Try again</Button>
        </div>
      ) : venues.length ? (
        <div className="eventforge-resource-grid">
          {venues.map((venue) => (
            <article key={venue._id} className="eventforge-resource-card">
              <div className="eventforge-resource-card__icon"><Building2 size={22} aria-hidden="true" /></div>
              <div className="eventforge-resource-card__content">
                <div className="eventforge-resource-card__topline">
                  <span className={`eventforge-status ${venue.isActive === false ? 'eventforge-status--cancelled' : 'eventforge-status--published'}`}>
                    {venue.isActive === false ? 'Inactive' : 'Active'}
                  </span>
                </div>
                <h2>{venue.name}</h2>
                <p>{venue.description || 'No description available.'}</p>
                <dl className="eventforge-resource-meta">
                  {venue.building || venue.roomNumber ? <div><dt>Location</dt><dd>{[venue.building, venue.roomNumber].filter(Boolean).join(' • ') || 'Not specified'}</dd></div> : null}
                  <div><dt>Capacity</dt><dd>{formatCapacity(venue.capacity)}</dd></div>
                  <div><dt>Seating</dt><dd>{venue.seatingType || 'Other'}</dd></div>
                </dl>
              </div>
              <div className="eventforge-resource-card__actions">
                <Link to={`/events/${eventId}/venues/${venue._id}`} className="eventforge-link">Details</Link>
                <Link to={`/events/${eventId}/venues/${venue._id}/edit`} aria-label={`Edit ${venue.name}`}><Pencil size={16} aria-hidden="true" /></Link>
                <button type="button" onClick={() => handleDelete(venue)} disabled={deletingId === venue._id} aria-label={`Delete ${venue.name}`}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          eyebrow="No venues"
          title="No rooms configured"
          description="Create the first venue for this event and assign sessions to it."
          action={<Button onClick={() => navigate(`/events/${eventId}/venues/new`)}><Plus size={15} aria-hidden="true" /> Add venue</Button>}
        />
      )}
    </div>
  );
}
