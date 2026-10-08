const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { getEventForTicketRequest, getTicketForEvent, serializeTicket } = require('../services/phase5Service');

const listTickets = async (req, res, next) => {
  try {
    const event = await getEventForTicketRequest(req.user, req.params.id, 'read');
    const tickets = await Ticket.find({ event: event._id }).sort({ price: 1, name: 1 });
    const data = tickets.map((ticket) => ({
      ...serializeTicket(ticket),
      remainingCount: Math.max(ticket.capacity - ticket.soldCount, 0),
    }));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createTicket = async (req, res, next) => {
  try {
    const event = await getEventForTicketRequest(req.user, req.params.id, 'manage');

    const existing = await Ticket.findOne({ event: event._id, name: new RegExp(`^${req.body.name.trim()}$`, 'i') });
    if (existing) {
      const error = new Error('A ticket with this name already exists for this event.');
      error.statusCode = 409;
      throw error;
    }

    const ticket = await Ticket.create({
      ...req.body,
      event: event._id,
      createdBy: req.user._id,
      saleStart: req.body.saleStart ? new Date(req.body.saleStart) : null,
      saleEnd: req.body.saleEnd ? new Date(req.body.saleEnd) : null,
    });

    res.status(201).json({ success: true, message: 'Ticket created.', data: serializeTicket(ticket) });
  } catch (error) {
    if (error.name === 'ValidationError') {
      error.statusCode = 422;
      error.details = Object.values(error.errors).map((issue) => ({ field: issue.path, message: issue.message }));
    }
    next(error);
  }
};

const getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      const error = new Error('Ticket not found.');
      error.statusCode = 404;
      throw error;
    }
    await getEventForTicketRequest(req.user, ticket.event.toString(), 'read');
    res.json({ success: true, data: serializeTicket(ticket) });
  } catch (error) {
    next(error);
  }
};

const updateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      const error = new Error('Ticket not found.');
      error.statusCode = 404;
      throw error;
    }
    await getEventForTicketRequest(req.user, ticket.event.toString(), 'manage');
    Object.assign(ticket, req.body);
    const updated = await ticket.save();
    res.json({ success: true, message: 'Ticket updated.', data: serializeTicket(updated) });
  } catch (error) {
    if (error.name === 'ValidationError') {
      error.statusCode = 422;
      error.details = Object.values(error.errors).map((issue) => ({ field: issue.path, message: issue.message }));
    }
    next(error);
  }
};

const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      const error = new Error('Ticket not found.');
      error.statusCode = 404;
      throw error;
    }
    await getEventForTicketRequest(req.user, ticket.event.toString(), 'manage');
    await ticket.deleteOne();
    res.json({ success: true, message: 'Ticket deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listTickets, createTicket, getTicket, updateTicket, deleteTicket };
