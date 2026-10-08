import { motion } from 'framer-motion';

export function StatCard({ label, value, detail, icon: Icon }) {
  return (
    <motion.div
      className="eventforge-stat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="eventforge-stat-card__header">
        <span>{label}</span>
        {Icon ? <Icon size={16} aria-hidden="true" /> : null}
      </div>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </motion.div>
  );
}
