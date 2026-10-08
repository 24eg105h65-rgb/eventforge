import { useEffect, useState } from 'react';
import { CalendarDays, Globe, Mail, MapPin, Tag, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';

const eventTypes = [
  'conference', 'workshop', 'exhibition', 'seminar', 'networking', 'corporate', 'summit', 'other',
];

const defaultEvent = {
  name: '',
  description: '',
  eventType: 'conference',
  status: 'draft',
  startDate: '',
  endDate: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  venue: '',
  address: '',
  city: '',
  country: '',
  capacity: '',
  registrationOpen: '',
  registrationClose: '',
  contactEmail: '',
  website: '',
  tags: '',
};

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const formatError = (details, field) => {
  if (!details) return '';
  const entries = Array.isArray(details) ? details : [details];
  const match = entries.find((item) => item?.field === field);
  return match?.message || '';
};

export function EventForm({ initialValues = {}, onSubmit, submitLabel, loading, submitError, mode = 'create' }) {
  const [form, setForm] = useState({ ...defaultEvent, ...initialValues });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm({
      ...defaultEvent,
      ...initialValues,
      startDate: toDateTimeLocal(initialValues.startDate),
      endDate: toDateTimeLocal(initialValues.endDate),
      registrationOpen: toDateTimeLocal(initialValues.registrationOpen),
      registrationClose: toDateTimeLocal(initialValues.registrationClose),
      tags: Array.isArray(initialValues.tags) ? initialValues.tags.join(', ') : '',
    });
    setErrors({});
  }, [initialValues]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Event name is required.';
    if (!form.startDate) nextErrors.startDate = 'Start date is required.';
    if (!form.endDate) nextErrors.endDate = 'End date is required.';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) nextErrors.endDate = 'End date must be on or after the start date.';
    if (!form.capacity || Number(form.capacity) <= 0) nextErrors.capacity = 'Capacity must be greater than zero.';
    if (form.registrationOpen && form.registrationClose && new Date(form.registrationClose) < new Date(form.registrationOpen)) nextErrors.registrationClose = 'Registration close must be after registration open.';
    if (form.registrationClose && form.startDate && new Date(form.registrationClose) > new Date(form.startDate)) nextErrors.registrationClose = 'Registration close cannot be after the event start date.';
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) nextErrors.contactEmail = 'Please enter a valid contact email.';
    if (form.website && !/^https?:\/\//i.test(form.website)) nextErrors.website = 'Please enter a valid website URL.';
    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      capacity: Number(form.capacity),
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      registrationOpen: form.registrationOpen || null,
      registrationClose: form.registrationClose || null,
      website: form.website.trim(),
      contactEmail: form.contactEmail.trim(),
    });
  };

  const fieldError = (field) => errors[field] || formatError(submitError, `body.${field}`);

  return (
    <motion.form
      className="eventforge-event-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      noValidate
    >
      <div className="eventforge-form-grid eventforge-form-grid--main">
        <label className="eventforge-field" htmlFor="event-name">
          <span>Event name *</span>
          <input id="event-name" className="eventforge-input" value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Annual Product Summit" />
          {fieldError('name') && <small className="eventforge-field-error">{fieldError('name')}</small>}
        </label>

        {mode === 'edit' ? (
          <label className="eventforge-field" htmlFor="event-status">
            <span>Status</span>
            <select id="event-status" className="eventforge-input" value={form.status} onChange={(event) => updateField('status', event.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        ) : null}
      </div>

      <label className="eventforge-field" htmlFor="event-description">
        <span>Description</span>
        <textarea id="event-description" className="eventforge-textarea" value={form.description} onChange={(event) => updateField('description', event.target.value)} rows="5" placeholder="Describe the event, audience, and objectives." />
      </label>

      <div className="eventforge-form-grid">
        <label className="eventforge-field" htmlFor="event-type">
          <span>Event type</span>
          <select id="event-type" className="eventforge-input" value={form.eventType} onChange={(event) => updateField('eventType', event.target.value)}>
            {eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>

        <label className="eventforge-field" htmlFor="event-capacity">
          <span>Capacity *</span>
          <div className="eventforge-input-shell eventforge-input-shell--tight"><Users size={15} aria-hidden="true" /><input id="event-capacity" type="number" min="1" className="eventforge-input eventforge-input--inline" value={form.capacity} onChange={(event) => updateField('capacity', event.target.value)} /></div>
          {fieldError('capacity') && <small className="eventforge-field-error">{fieldError('capacity')}</small>}
        </label>
      </div>

      <div className="eventforge-form-grid">
        <label className="eventforge-field" htmlFor="event-start-date">
          <span>Start date *</span>
          <div className="eventforge-input-shell eventforge-input-shell--tight"><CalendarDays size={15} aria-hidden="true" /><input id="event-start-date" type="date" className="eventforge-input eventforge-input--inline" value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} /></div>
          {fieldError('startDate') && <small className="eventforge-field-error">{fieldError('startDate')}</small>}
        </label>
        <label className="eventforge-field" htmlFor="event-end-date">
          <span>End date *</span>
          <div className="eventforge-input-shell eventforge-input-shell--tight"><CalendarDays size={15} aria-hidden="true" /><input id="event-end-date" type="date" className="eventforge-input eventforge-input--inline" value={form.endDate} onChange={(event) => updateField('endDate', event.target.value)} /></div>
          {fieldError('endDate') && <small className="eventforge-field-error">{fieldError('endDate')}</small>}
        </label>
      </div>

      {mode === 'edit' ? (
        <div className="eventforge-form-grid">
          <label className="eventforge-field" htmlFor="event-timezone">
            <span>Timezone</span>
            <div className="eventforge-input-shell eventforge-input-shell--tight"><Globe size={15} aria-hidden="true" /><input id="event-timezone" className="eventforge-input eventforge-input--inline" value={form.timezone} onChange={(event) => updateField('timezone', event.target.value)} /></div>
          </label>
          <label className="eventforge-field" htmlFor="event-venue">
            <span>Venue</span>
            <div className="eventforge-input-shell eventforge-input-shell--tight"><MapPin size={15} aria-hidden="true" /><input id="event-venue" className="eventforge-input eventforge-input--inline" value={form.venue} onChange={(event) => updateField('venue', event.target.value)} /></div>
          </label>
        </div>
      ) : (
        <label className="eventforge-field" htmlFor="event-venue">
          <span>Venue</span>
          <div className="eventforge-input-shell eventforge-input-shell--tight"><MapPin size={15} aria-hidden="true" /><input id="event-venue" className="eventforge-input eventforge-input--inline" value={form.venue} onChange={(event) => updateField('venue', event.target.value)} /></div>
        </label>
      )}

      {mode === 'edit' ? (
        <div className="eventforge-form-grid">
          <label className="eventforge-field" htmlFor="event-address">
            <span>Address</span>
            <input id="event-address" className="eventforge-input" value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder="10 Market Street" />
          </label>
          <label className="eventforge-field" htmlFor="event-city">
            <span>City</span>
            <input id="event-city" className="eventforge-input" value={form.city} onChange={(event) => updateField('city', event.target.value)} placeholder="New York" />
          </label>
        </div>
      ) : null}

      {mode === 'edit' ? (
        <div className="eventforge-form-grid">
          <label className="eventforge-field" htmlFor="event-country">
            <span>Country</span>
            <input id="event-country" className="eventforge-input" value={form.country} onChange={(event) => updateField('country', event.target.value)} placeholder="United States" />
          </label>
          <label className="eventforge-field" htmlFor="event-registration-open">
            <span>Registration open</span>
            <input id="event-registration-open" type="datetime-local" className="eventforge-input" value={form.registrationOpen} onChange={(event) => updateField('registrationOpen', event.target.value)} />
          </label>
        </div>
      ) : null}

      <div className="eventforge-form-grid">
        <label className="eventforge-field" htmlFor="event-registration-close">
          <span>Registration close</span>
          <input id="event-registration-close" type="date" className="eventforge-input" value={form.registrationClose} onChange={(event) => updateField('registrationClose', event.target.value)} />
          {fieldError('registrationClose') && <small className="eventforge-field-error">{fieldError('registrationClose')}</small>}
        </label>
        <label className="eventforge-field" htmlFor="event-contact-email">
          <span>Contact email</span>
          <div className="eventforge-input-shell eventforge-input-shell--tight"><Mail size={15} aria-hidden="true" /><input id="event-contact-email" type="email" className="eventforge-input eventforge-input--inline" value={form.contactEmail} onChange={(event) => updateField('contactEmail', event.target.value)} /></div>
          {fieldError('contactEmail') && <small className="eventforge-field-error">{fieldError('contactEmail')}</small>}
        </label>
      </div>

      {mode === 'edit' ? (
        <div className="eventforge-form-grid">
          <label className="eventforge-field" htmlFor="event-website">
            <span>Website</span>
            <div className="eventforge-input-shell eventforge-input-shell--tight"><Globe size={15} aria-hidden="true" /><input id="event-website" type="url" className="eventforge-input eventforge-input--inline" value={form.website} onChange={(event) => updateField('website', event.target.value)} placeholder="https://example.com" /></div>
            {fieldError('website') && <small className="eventforge-field-error">{fieldError('website')}</small>}
          </label>
          <label className="eventforge-field" htmlFor="event-tags">
            <span>Tags</span>
            <div className="eventforge-input-shell eventforge-input-shell--tight"><Tag size={15} aria-hidden="true" /><input id="event-tags" className="eventforge-input eventforge-input--inline" value={form.tags} onChange={(event) => updateField('tags', event.target.value)} placeholder="Leadership, product" /></div>
          </label>
        </div>
      ) : null}

      {submitError && <p className="eventforge-form-error">{submitError}</p>}

      <div className="eventforge-form-actions">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : submitLabel}
        </Button>
        <Button type="button" variant="secondary" as="a" href="/events">Cancel</Button>
      </div>
    </motion.form>
  );
}
