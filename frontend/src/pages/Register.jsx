import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const roles = [
  { value: 'organizer', label: 'Organizer' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'attendee', label: 'Attendee' },
];

export function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'attendee',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(form);
      toast.success('You are now in. 🎟️');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Account could not be created.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="eventforge-auth-page eventforge-auth-page--compact">
      <div className="eventforge-auth-copy">
        <Link to="/" className="eventforge-auth-brand">EVENTFORGE</Link>
        <p className="eventforge-eyebrow">Create your account</p>
        <h1>
          MAKE<br />
          YOUR<br />
          <span>MARK.</span>
        </h1>
        <p className="eventforge-auth-description">
          Join the platform for the next great event moment.
        </p>
      </div>

      <form className="eventforge-register-card" onSubmit={handleSubmit} noValidate>
        <div className="eventforge-auth-card__header">
          <span className="eventforge-eyebrow">Create account</span>
          <h2>BUILD YOUR ACCESS</h2>
        </div>

        <label className="eventforge-field" htmlFor="register-name">
          <span>Name</span>
          <div className="eventforge-input-shell">
            <UserRound size={15} aria-hidden="true" />
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              required
              minLength="2"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>
        </label>

        <label className="eventforge-field" htmlFor="register-email">
          <span>Email</span>
          <div className="eventforge-input-shell">
            <Mail size={15} aria-hidden="true" />
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
        </label>

        <label className="eventforge-field" htmlFor="register-password">
          <span>Password</span>
          <div className="eventforge-input-shell">
            <LockKeyhole size={15} aria-hidden="true" />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength="8"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            <button type="button" className="eventforge-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>
        </label>

        <label className="eventforge-field" htmlFor="register-confirm-password">
          <span>Confirm Password</span>
          <div className="eventforge-input-shell">
            <LockKeyhole size={15} aria-hidden="true" />
            <input
              id="register-confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength="8"
              value={form.confirmPassword}
              onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
            />
          </div>
        </label>

        <label className="eventforge-field" htmlFor="register-role">
          <span>Role</span>
          <select id="register-role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </label>

        <Button type="submit" disabled={isSubmitting} className="eventforge-auth-submit">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="eventforge-auth-footer">
          Already in? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
