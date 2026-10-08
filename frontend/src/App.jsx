import { ArrowRight, Check, ChevronDown, CirclePlay, MapPin, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navigate, Route, Routes } from 'react-router-dom';
import CircularCarousel from './components/CircularCarousel';
import { DashboardLayout } from './components/DashboardLayout';
import { EventCard } from './components/EventCard';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { events } from './data/events';
import { Dashboard } from './pages/Dashboard';
import { MyEventsPage } from './pages/MyEventsPage';
import { MySessionsPage } from './pages/MySessionsPage';
import { CouponFormPage } from './pages/coupons/CouponFormPage';
import { CouponsPage } from './pages/coupons/CouponsPage';
import { CreateEventPage } from './pages/events/CreateEventPage';
import { EditEventPage } from './pages/events/EditEventPage';
import { EventDetailsPage } from './pages/events/EventDetailsPage';
import { EventsPage } from './pages/events/EventsPage';
import { OrganizerRegistrationsPage } from './pages/registrations/OrganizerRegistrationsPage';
import { MyRegistrationsPage } from './pages/registrations/MyRegistrationsPage';
import { RegisterPage } from './pages/registrations/RegisterPage';
import { CreateSessionPage } from './pages/sessions/CreateSessionPage';
import { EditSessionPage } from './pages/sessions/EditSessionPage';
import { SchedulePage } from './pages/sessions/SchedulePage';
import { SessionDetailsPage } from './pages/sessions/SessionDetailsPage';
import { SessionsPage } from './pages/sessions/SessionsPage';
import { TicketDetailsPage } from './pages/tickets/TicketDetailsPage';
import { TicketFormPage } from './pages/tickets/TicketFormPage';
import { TicketsPage } from './pages/tickets/TicketsPage';
import { CreateVenuePage } from './pages/venues/CreateVenuePage';
import { EditVenuePage } from './pages/venues/EditVenuePage';
import { VenueDetailsPage } from './pages/venues/VenueDetailsPage';
import { VenuesPage } from './pages/venues/VenuesPage';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Register } from './pages/Register';
import { RoleRoute } from './components/RoleRoute';
import './App.css';

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
  {
    src: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
    alt: 'Product launch event stage',
    title: 'Launch',
    subtitle: 'MAKE NOISE',
  },
];

const features = [
  'Private event spaces',
  'Session planning',
  'Speaker coordination',
  'Ticketing and access',
  'Live attendance data',
  'AI-powered content',
];

function LandingPage() {
  return (
    <div className="eventforge-app" id="top">
      <Navbar />

      <main>
        <motion.section
          className="eventforge-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="eventforge-hero__visual">
            <div className="eventforge-carousel-shell">
              <div className="eventforge-hero__side eventforge-hero__side--left">
                <div className="eventforge-side-card">
                  <strong className="eventforge-side-card__val">EXHIBITION</strong>
                </div>

                <div className="eventforge-side-card eventforge-side-card--alt">
                  <strong className="eventforge-side-card__val">CONFERENCE</strong>
                </div>

                <div className="eventforge-side-card">
                  <strong className="eventforge-side-card__val">HACKATHON</strong>
                </div>
              </div>

              <CircularCarousel
                items={eventTypes}
                preset="cylinder"
                intro="rise"
                cardWidth={380}
                gap={35}
                aspectRatio={1}
                speed={14}
                captions
              />

              <div className="eventforge-hero__side eventforge-hero__side--right">
                <div className="eventforge-side-card">
                  <strong className="eventforge-side-card__val">SUMMIT</strong>
                </div>

                <div className="eventforge-side-card eventforge-side-card--alt">
                  <strong className="eventforge-side-card__val">LAUNCH</strong>
                </div>

                <div className="eventforge-side-card">
                  <strong className="eventforge-side-card__val">WORKSHOP</strong>
                </div>
              </div>
            </div>

            <a href="#hero-content" className="eventforge-scroll-down" aria-label="Scroll to details">
              <ChevronDown size={22} aria-hidden="true" />
            </a>
          </div>

          <div className="eventforge-hero__content" id="hero-content">
            <span className="eventforge-eyebrow">EventForge</span>
            <h1>
              EVENTS.<br />
              BUT MAKE<br />
              <span>THEM BETTER.</span>
            </h1>
            <p>
              A more considered way to plan, run, and remember extraordinary corporate moments.
            </p>

            <div className="eventforge-hero__actions">
              <Button as="a" href="/login">
                Enter the forge
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
            </div>

            <ul className="eventforge-feature-list" aria-label="EventForge features">
              {features.map((feature) => (
                <li key={feature}>
                  <Check size={14} aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        <section className="eventforge-section eventforge-section--split" id="events">
          <div className="eventforge-section__heading">
            <span className="eventforge-eyebrow">Upcoming moments</span>
            <h2>MARK THE DATES.</h2>
          </div>
          <div className="eventforge-events-grid">
            {events.map((event, index) => (
              <EventCard key={event.title} event={event} index={index} />
            ))}
          </div>
        </section>

        <section className="eventforge-section eventforge-section--about" id="about">
          <Card className="eventforge-about-card">
            <div>
              <span className="eventforge-eyebrow">What we build</span>
              <h2>PLANNING, WITHOUT THE NOISE.</h2>
            </div>
            <p>
              From the first brief to the final check-in, EventForge keeps every important detail in one focused place.
            </p>
            <div className="eventforge-about-card__meta">
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route
        path="/my-events"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['organizer', 'speaker']}><MyEventsPage /></RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-sessions"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['speaker']}><MySessionsPage /></RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['organizer', 'attendee', 'speaker']}><EventsPage /></RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route path="/events/new" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><CreateEventPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer', 'attendee', 'speaker']}><EventDetailsPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:id/edit" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><EditEventPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/tickets" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><TicketsPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/tickets/new" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><TicketFormPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/tickets/:ticketId" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><TicketDetailsPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/tickets/:ticketId/edit" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><TicketFormPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/register" element={<ProtectedRoute><RoleRoute allowedRoles={['attendee']}><RegisterPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/registrations" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><OrganizerRegistrationsPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/coupons" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><CouponsPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/coupons/new" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><CouponFormPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/coupons/:couponId/edit" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><CouponFormPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/my-registrations" element={<ProtectedRoute><RoleRoute allowedRoles={['attendee']}><MyRegistrationsPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/venues" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><VenuesPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/venues/new" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><CreateVenuePage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/venues/:venueId" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><VenueDetailsPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/venues/:venueId/edit" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><EditVenuePage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/sessions" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer', 'speaker']}><SessionsPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/sessions/new" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><CreateSessionPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/sessions/:sessionId" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer', 'speaker']}><SessionDetailsPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/sessions/:sessionId/edit" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer']}><EditSessionPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/events/:eventId/schedule" element={<ProtectedRoute><RoleRoute allowedRoles={['organizer', 'speaker']}><SchedulePage /></RoleRoute></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
