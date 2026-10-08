const express = require('express');
const { listTickets, createTicket, getTicket, updateTicket, deleteTicket } = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ticketSchema, ticketUpdateSchema, ticketParamsSchema } = require('../validators/ticketValidator');

const router = express.Router();

router.use(auth);
router.get('/events/:id/tickets', validate(ticketParamsSchema), listTickets);
router.post('/events/:id/tickets', validate(ticketParamsSchema, 422), validate(ticketSchema, 422), createTicket);
router.get('/tickets/:id', validate(ticketParamsSchema), getTicket);
router.put('/tickets/:id', validate(ticketUpdateSchema, 422), updateTicket);
router.delete('/tickets/:id', validate(ticketParamsSchema), deleteTicket);

module.exports = router;
