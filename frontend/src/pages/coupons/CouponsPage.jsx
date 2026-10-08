import { useEffect, useState } from 'react';
import { ArrowLeft, Edit3, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { deleteCoupon, getEventCoupons } from '../../services/phase5Service';

const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const formatDate = (value) => (value ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value)) : 'Not set');

export function CouponsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const loadCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getEventCoupons(eventId);
      setCoupons(response.data);
    } catch (requestError) {
      setError(requestError.message || 'Coupons could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [eventId]);

  const handleDelete = async (couponId) => {
    if (!window.confirm('Delete this coupon?')) return;
    setDeletingId(couponId);
    try {
      await deleteCoupon(couponId);
      setCoupons((current) => current.filter((coupon) => coupon._id !== couponId));
    } catch (requestError) {
      setError(requestError.message || 'Coupon could not be deleted.');
    } finally {
      setDeletingId('');
    }
  };

  if (loading) return <div className="eventforge-loading-panel">Loading coupons…</div>;
  if (error && !coupons.length) return <div className="eventforge-error-panel"><strong>Coupons unavailable.</strong><p>{error}</p><Link to={`/events/${eventId}`} className="eventforge-primary-link">Back to event</Link></div>;

  return (
    <div className="eventforge-event-page">
      <header className="eventforge-page-header">
        <div>
          <p className="eventforge-eyebrow">Coupons</p>
          <h1>COUPONS</h1>
          <p className="eventforge-page-subtitle">Create event discounts and manage their availability.</p>
        </div>
        <div className="eventforge-form-actions">
          <Link to={`/events/${eventId}`} className="eventforge-primary-link"><ArrowLeft size={15} aria-hidden="true" /> Event</Link>
          <Button onClick={() => navigate(`/events/${eventId}/coupons/new`)}><Plus size={15} aria-hidden="true" /> Create coupon</Button>
        </div>
      </header>

      {coupons.length ? (
        <div className="eventforge-resource-grid">
          {coupons.map((coupon) => (
            <article key={coupon._id} className="eventforge-resource-card">
              <div className="eventforge-resource-card__icon"><strong>{coupon.code}</strong></div>
              <div className="eventforge-resource-card__content">
                <h2>{coupon.description || 'Event discount'}</h2>
                <p>{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% off` : `${formatCurrency(coupon.discountValue)} fixed`}</p>
                <div className="eventforge-ticket-meta">
                  <span><strong>{coupon.maxUses - coupon.usedCount}</strong> remaining</span>
                  <span><strong>{coupon.minimumAmount ? formatCurrency(coupon.minimumAmount) : 'None'}</strong> minimum</span>
                  <span><strong>{coupon.active ? 'Active' : 'Inactive'}</strong> status</span>
                </div>
                <div className="eventforge-resource-card__status">
                  <span>Valid: {formatDate(coupon.validFrom)} — {formatDate(coupon.validUntil)}</span>
                </div>
              </div>
              <div className="eventforge-resource-card__actions">
                <Link to={`/events/${eventId}/coupons/${coupon._id}/edit`} className="eventforge-primary-link"><Edit3 size={15} aria-hidden="true" /> Edit</Link>
                <Button variant="secondary" onClick={() => handleDelete(coupon._id)} disabled={deletingId === coupon._id}><Trash2 size={15} aria-hidden="true" /> {deletingId === coupon._id ? 'Deleting…' : 'Delete'}</Button>
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyState title="No coupons" description="Create a coupon for this event." action={<Button onClick={() => navigate(`/events/${eventId}/coupons/new`)}><Plus size={15} aria-hidden="true" /> Create coupon</Button>} />}
    </div>
  );
}
