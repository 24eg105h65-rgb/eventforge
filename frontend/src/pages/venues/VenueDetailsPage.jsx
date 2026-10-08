import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { getVenue, deleteVenue } from '../../services/venueService';

const formatCapacity = (value) => `${Number(value || 0).toLocaleString()} guests`;

export function VenueDetailsPage() {
  const { eventId, venueId } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadVenue = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getVenue(venueId);
        setVenue(response.data);
      } catch (requestError) {
        setError(requestError.message || 'Venue could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    loadVenue();
  }, [venueId]);

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete ${venue.name}? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteVenue(venueId);
      toast.success('Venue deleted.');
      navigate(`/events/${eventId}/venues`);
    } catch (requestError) {
      toast.error(requestError.message || 'Venue could not be deleted.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="eventforge-loading-panel">Loading venue…</div>;
  if (error) return <div className="eventforge-error-panel"><strong>Venue unavailable.</strong><p>{error}</p><Link to={`/events/${eventId}/venues`} className="eventforge-primary-link">Return to venues</Link></div>;
  if (!venue) return null;

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <Link to={`/events/${eventId}/venues`} className="eventforge-back-link"><ArrowLeft size={15} aria-hidden="true" /> Venues</Link>
        <div>
          <p className="eventforge-eyebrow">Venue details</p>
          <h1>{venue.name}</h1>
        </div>
      </header>

      <section className="eventforge-detail-hero eventforge-detail-hero--resource">
        <div>
          <span className={`eventforge-status ${venue.isActive === false ? 'eventforge-status--cancelled' : 'eventforge-status--published'}`}>
            {venue.isActive === false ? 'Inactive' : 'Active'}
          </span>
          <h2>{venue.building || 'Venue location'}</h2>
          <p>{venue.roomNumber ? `Room ${venue.roomNumber}` : 'Room details available'}</p>
        </div>
      </section>

      <div className="eventforge-detail-content">
        <article className="eventforge-detail-panel">
          <h2>Venue information</h2>
          <p>{venue.description || 'No description provided.'}</p>
          <dl className="eventforge-detail-list">
            <div><dt><Building2 size={14} /> Capacity</dt><dd>{formatCapacity(venue.capacity)}</dd></div>
            <div><dt><MapPin size={14} /> Address</dt><dd>{venue.address || 'Not specified'}</dd></div>
            <div><dt>Seating</dt><dd>{venue.seatingType || 'Other'}</dd></div>
            <div><dt>Facilities</dt><dd>{venue.facilities?.length ? venue.facilities.join(', ') : 'None listed'}</dd></div>
          </dl>
        </article>

        <aside className="eventforge-detail-panel eventforge-detail-panel--sidebar">
          <h2>Actions</h2>
          <div className="eventforge-action-stack">
            <Link to={`/events/${eventId}/venues/${venueId}/edit`} className="eventforge-primary-link"><Pencil size={15} aria-hidden="true" /> Edit venue</Link>
            <Button type="button" variant="secondary" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete venue'}</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
