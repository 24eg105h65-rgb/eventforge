const express = require('express');
const { listSessions, createSession, getSession, updateSession, deleteSession, getSchedule } = require('../controllers/sessionController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sessionSchema, sessionUpdateSchema, sessionIdSchema } = require('../validators/sessionValidator');

const router = express.Router();

router.use(auth);
router.get('/:id', validate(sessionIdSchema), getSession);
router.put('/:id', validate(sessionUpdateSchema, 422), updateSession);
router.delete('/:id', validate(sessionIdSchema), deleteSession);

module.exports = router;
