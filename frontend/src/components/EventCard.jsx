import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function EventCard({ event, index = 0 }) {
  return (
    <motion.article
      className="eventforge-event-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
    >
      <div className="eventforge-event-card__image" style={{ backgroundImage: `url(${event.image})` }}>
        <span>{event.date}</span>
      </div>
      <div className="eventforge-event-card__body">
        <p className="eventforge-meta">{event.location}</p>
        <h3>{event.title}</h3>
        <div className="eventforge-event-card__details">
          <span>{event.category}</span>
          <span>{event.attendees}</span>
        </div>
        <button type="button" className="eventforge-link">
          View event
          <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </div>
    </motion.article>
  );
}
