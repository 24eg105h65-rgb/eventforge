import { ArrowUpRight, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="eventforge-navbar">
      <Link className="eventforge-brand" to="/" aria-label="EventForge home">
        EVENTFORGE
      </Link>

      <div className="eventforge-navbar__center">
        <span>FORGE YOUR EVENT HERE!!!</span>
      </div>

      {isAuthenticated ? (
        <div className="eventforge-nav__actions">
          <Link className="eventforge-nav__dashboard" to="/dashboard">
            Dashboard
          </Link>
          <button type="button" className="eventforge-nav__logout" onClick={logout}>
            <LogOut size={15} aria-hidden="true" />
            Logout
          </button>
        </div>
      ) : (
        <div className="eventforge-nav__actions">
          <Button variant="ghost" className="eventforge-nav__button" as={Link} to="/login">
            Login
          </Button>
          <Button className="eventforge-nav__button" as={Link} to="/register">
            Sign in
            <ArrowUpRight size={15} aria-hidden="true" />
          </Button>
        </div>
      )}
    </header>
  );
}
