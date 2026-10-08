const express = require('express');
const { createEvent, listEvents, getEvent, updateEvent, deleteEvent, getEventOverview } = require('../controllers/eventController');
const { listVenues, createVenue } = require('../controllers/venueController');
const { listSessions, createSession, getSchedule } = require('../controllers/sessionController');
const { listTickets, createTicket } = require('../controllers/ticketController');
const { getEventRegistrations, createRegistration } = require('../controllers/registrationController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { eventSchema, eventUpdateSchema, eventParamsSchema, listQuerySchema } = require('../validators/eventValidator');
const { venueSchema, venueParamsSchema } = require('../validators/venueValidator');
const { sessionSchema, sessionParamsSchema, scheduleQuerySchema } = require('../validators/sessionValidator');
const { ticketSchema, ticketParamsSchema } = require('../validators/ticketValidator');
const { registrationSchema, registrationListQuery } = require('../validators/registrationValidator');

const router = express.Router();

router.use(auth);
router.get('/', validate(listQuerySchema), listEvents);
router.post('/', validate(eventSchema, 422), createEvent);
router.get('/:id/overview', validate(eventParamsSchema), getEventOverview);
router.get('/:id/venues', validate(venueParamsSchema), listVenues);
router.post('/:id/venues', validate(eventParamsSchema, 422), validate(venueSchema, 422), createVenue);
router.get('/:id/sessions', validate(sessionParamsSchema), listSessions);
router.post('/:id/sessions', validate(eventParamsSchema, 422), validate(sessionSchema, 422), createSession);
router.get('/:id/schedule', validate(eventParamsSchema), validate(scheduleQuerySchema, 422), getSchedule);
router.get('/:id/tickets', validate(eventParamsSchema), listTickets);
router.post('/:id/tickets', validate(eventParamsSchema, 422), validate(ticketSchema, 422), createTicket);
router.get('/:id/registrations', validate(registrationListQuery), getEventRegistrations);
router.post('/:id/registrations', validate(eventParamsSchema, 422), validate(registrationSchema, 422), createRegistration);
router.get('/:id', validate(eventParamsSchema), getEvent);
router.put('/:id', validate(eventUpdateSchema, 422), updateEvent);
router.delete('/:id', validate(eventParamsSchema), deleteEvent);

module.exports = router;
