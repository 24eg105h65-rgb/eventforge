import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { createCoupon, getCoupon, updateCoupon } from '../../services/phase5Service';

const defaultCoupon = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  maxUses: 1,
  validFrom: '',
  validUntil: '',
  minimumAmount: 0,
  active: true,
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export function CouponFormPage() {
  const { eventId, couponId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultCoupon);
  const [loading, setLoading] = useState(Boolean(couponId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!couponId) return;

    getCoupon(couponId)
      .then((response) => setForm({
        ...response.data,
        discountValue: response.data.discountValue ?? '',
        maxUses: response.data.maxUses ?? 1,
        minimumAmount: response.data.minimumAmount ?? 0,
        validFrom: formatDateTime(response.data.validFrom),
        validUntil: formatDateTime(response.data.validUntil),
      }))
      .catch((requestError) => setError(requestError.message || 'Coupon could not be loaded.'))
      .finally(() => setLoading(false));
  }, [couponId]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        code: form.code.trim(),
        description: form.description.trim(),
        discountValue: Number(form.discountValue),
        maxUses: Number(form.maxUses),
        minimumAmount: Number(form.minimumAmount),
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
        active: Boolean(form.active),
      };

      if (couponId) await updateCoupon(couponId, payload); else await createCoupon(eventId, payload);
      navigate(`/events/${eventId}/coupons`);
    } catch (requestError) {
      setError(requestError.message || 'Coupon could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="eventforge-loading-panel">Loading coupon…</div>;

  return (
    <div className="eventforge-event-page eventforge-page--form">
      <header className="eventforge-page-header eventforge-page-header--compact">
        <div>
          <p className="eventforge-eyebrow">{couponId ? 'Edit coupon' : 'Create coupon'}</p>
          <h1>{couponId ? 'UPDATE COUPON' : 'NEW COUPON'}</h1>
        </div>
        <Link to={`/events/${eventId}/coupons`} className="eventforge-primary-link"><ArrowLeft size={15} aria-hidden="true" /> Back to coupons</Link>
      </header>

      <section className="eventforge-form-panel">
        <form className="eventforge-event-form" onSubmit={handleSubmit}>
          <div className="eventforge-form-grid">
            <label className="eventforge-field">
              <span>Coupon code</span>
              <input className="eventforge-input" value={form.code} onChange={(event) => updateField('code', event.target.value)} maxLength="40" required />
            </label>
            <label className="eventforge-field">
              <span>Discount type</span>
              <select className="eventforge-input" value={form.discountType} onChange={(event) => updateField('discountType', event.target.value)}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </select>
            </label>
            <label className="eventforge-field">
              <span>{form.discountType === 'PERCENTAGE' ? 'Percentage value' : 'Fixed amount'}</span>
              <input className="eventforge-input" type="number" min="0" max={form.discountType === 'PERCENTAGE' ? '100' : undefined} step="0.01" value={form.discountValue} onChange={(event) => updateField('discountValue', event.target.value)} required />
            </label>
            <label className="eventforge-field">
              <span>Maximum uses</span>
              <input className="eventforge-input" type="number" min="1" value={form.maxUses} onChange={(event) => updateField('maxUses', event.target.value)} />
            </label>
            <label className="eventforge-field">
              <span>Valid from</span>
              <input className="eventforge-input" type="datetime-local" value={form.validFrom} onChange={(event) => updateField('validFrom', event.target.value)} />
            </label>
            <label className="eventforge-field">
              <span>Valid until</span>
              <input className="eventforge-input" type="datetime-local" value={form.validUntil} onChange={(event) => updateField('validUntil', event.target.value)} />
            </label>
            <label className="eventforge-field">
              <span>Minimum purchase</span>
              <input className="eventforge-input" type="number" min="0" step="0.01" value={form.minimumAmount} onChange={(event) => updateField('minimumAmount', event.target.value)} />
            </label>
          </div>

          <label className="eventforge-field">
            <span>Description</span>
            <textarea className="eventforge-textarea" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
          </label>

          <label className="eventforge-checkbox">
            <input type="checkbox" checked={form.active} onChange={(event) => updateField('active', event.target.checked)} />
            <span>Coupon is active</span>
          </label>

          {error ? <p className="eventforge-form-error" role="alert">{error}</p> : null}
          <div className="eventforge-form-actions">
            <Link to={`/events/${eventId}/coupons`} className="eventforge-button eventforge-button--secondary">Cancel</Link>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : couponId ? 'Save changes' : 'Create coupon'}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
