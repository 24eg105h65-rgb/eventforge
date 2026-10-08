import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

export function ConfirmDeleteModal({ open, eventName, onCancel, onConfirm, loading }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="eventforge-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="eventforge-modal"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-event-title"
          >
            <div className="eventforge-modal__icon"><AlertTriangle size={24} aria-hidden="true" /></div>
            <h2 id="delete-event-title">Delete event?</h2>
            <p>
              This will permanently remove <strong>{eventName}</strong>. This action cannot be undone.
            </p>
            <div className="eventforge-modal__actions">
              <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Keep event</Button>
              <Button type="button" onClick={onConfirm} disabled={loading}>{loading ? 'Deleting…' : 'Delete event'}</Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
