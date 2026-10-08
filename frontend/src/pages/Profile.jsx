import { useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [interests, setInterests] = useState((user?.interests || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile({
        name,
        avatar: avatar.trim() || undefined,
        interests: interests.split(',').map((interest) => interest.trim()).filter(Boolean),
      });
      setSuccess('Profile updated.');
    } catch (requestError) {
      setError(requestError.message || 'Profile could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="eventforge-settings-page">
      <p className="eventforge-eyebrow">Account</p>
      <h1>Your profile</h1>
      <form className="eventforge-form-panel eventforge-event-form" onSubmit={handleSubmit}>
        <div className="eventforge-settings-card">
          <div>
            <span>Name</span>
            <strong>{user?.name || 'Not available'}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{user?.email || 'Not available'}</strong>
          </div>
          <div>
            <span>Role</span>
            <strong>{user?.role || 'member'}</strong>
          </div>
        </div>

        <label className="eventforge-field">
          <span>Display name</span>
          <input className="eventforge-input" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="eventforge-field">
          <span>Avatar URL</span>
          <input className="eventforge-input" type="url" value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://example.com/avatar.png" />
        </label>
        <label className="eventforge-field">
          <span>Interests</span>
          <input className="eventforge-input" value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Design, Events, Technology" />
        </label>

        {error ? <p className="eventforge-form-error" role="alert">{error}</p> : null}
        {success ? <p className="eventforge-field-success">{success}</p> : null}
        <div className="eventforge-form-actions">
          <Button type="submit" disabled={saving}><Save size={15} aria-hidden="true" /> {saving ? 'Saving…' : 'Save profile'}</Button>
        </div>
      </form>
    </div>
  );
}
