import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import CircularCarousel from '../components/CircularCarousel';

const eventTypes = [
  {
    src: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    alt: 'Conference audience in a dark venue',
    title: 'Conference',
    subtitle: 'BIG IDEAS',
  },
  {
    src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Workshop participants collaborating',
    title: 'Workshop',
    subtitle: 'BUILD MODE',
  },
  {
    src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    alt: 'Exhibition hall with visitors',
    title: 'Exhibition',
    subtitle: 'SHOWCASE',
  },
  {
    src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    alt: 'Business summit stage',
    title: 'Summit',
    subtitle: 'FOCUSED ENERGY',
  },
  {
    src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    alt: 'Hackathon team reviewing a project',
    title: 'Hackathon',
    subtitle: 'SHIP IT',
  },
];

export function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: true });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login(form);
      toast.success('You are now logged in.');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="eventforge-auth-page">
      <div className="eventforge-auth-copy">
        <Link to="/" className="eventforge-auth-brand">EVENTFORGE</Link>
        <p className="eventforge-eyebrow">Built for better moments</p>
        <h1>
          EVENTS.<br />
          BUT MAKE<br />
          <span>THEM BETTER.</span>
        </h1>
        <p className="eventforge-auth-description">
          Planning, production, and participation—without the chaos.
        </p>

        <ul className="eventforge-auth-features">
          <li><Sparkles size={14} aria-hidden="true" /> Organizer event management</li>
          <li><Sparkles size={14} aria-hidden="true" /> Speaker session access</li>
          <li><Sparkles size={14} aria-hidden="true" /> Attendee event access</li>
        </ul>
      </div>

      <div className="eventforge-auth-visual">
        <div className="eventforge-auth-carousel">
          <CircularCarousel
            items={eventTypes}
            preset="cylinder"
            intro="rise"
            cardWidth={210}
            aspectRatio={1}
            speed={12}
            captions
          />
        </div>

        <form className="eventforge-auth-card" onSubmit={handleSubmit} noValidate>
          <div className="eventforge-auth-card__header">
            <span className="eventforge-eyebrow">Access portal</span>
            <h2>ENTER THE FORGE</h2>
          </div>

          <label className="eventforge-field" htmlFor="login-email">
            <span>Email</span>
            <div className="eventforge-input-shell">
              <Mail size={15} aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                placeholder="you@eventforge.com"
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
          </label>

          <label className="eventforge-field" htmlFor="login-password">
            <span>Password</span>
            <div className="eventforge-input-shell">
              <LockKeyhole size={15} aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                minLength="8"
                value={form.password}
                placeholder="Enter your password"
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
              <button type="button" className="eventforge-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </label>

          <div className="eventforge-auth-options">
            <label className="eventforge-checkbox">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(event) => setForm({ ...form, rememberMe: event.target.checked })}
              />
              <span>Remember me</span>
            </label>
            <Link to="/login" className="eventforge-text-link">Forgot password</Link>
          </div>

          <Button type="submit" disabled={isSubmitting} className="eventforge-auth-submit">
            {isSubmitting ? 'Signing in…' : 'Enter the forge'}
          </Button>

          <p className="eventforge-auth-footer">
            New here?
            <Link to="/register">Create account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
