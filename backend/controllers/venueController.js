const Event = require('../models/Event');
const Session = require('../models/Session');
const Venue = require('../models/Venue');

const canManageEvent = (user, event) => {
  if (user.role === 'platform_admin') return true;
  if (!event || user.role === 'staff') return false;
  return user._id.toString() === event.createdBy?.toString() || user._id.toString() === event.organizer?.toString();
};

const canReadEvent = (user, event) => {
  if (user.role === 'platform_admin') return true;
  if (!event) return false;
  return true;
};

const ensureEventAccess = async (user, eventId, operation = 'read') => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }
  const allowed = operation === 'read' ? canReadEvent(user, event) : canManageEvent(user, event);
  if (!allowed) {
    const error = new Error('You do not have access to this event.');
    error.statusCode = operation === 'read' ? 403 : 403;
    throw error;
  }
  return event;
};

const serializeVenue = (venue) => ({
  ...venue.toObject(),
  _id: venue._id.toString(),
  event: venue.event?.toString(),
  createdBy: venue.createdBy?.toString(),
});

const listVenues = async (req, res, next) => {
  try {
    const event = await ensureEventAccess(req.user, req.params.id, 'read');
    const venues = await Venue.find({ event: event._id }).sort({ name: 1 });
    res.json({ success: true, data: venues.map(serializeVenue) });
  } catch (error) {
    next(error);
  }
};

const createVenue = async (req, res, next) => {
  try {
    const event = await ensureEventAccess(req.user, req.params.id, 'manage');
    const existing = await Venue.findOne({ event: event._id, name: new RegExp(`^${req.body.name.trim()}$`, 'i') });
    if (existing) {
      const error = new Error('A venue with this name already exists for this event.');
      error.statusCode = 409;
      throw error;
    }

    const venue = await Venue.create({
      ...req.body,
      event: event._id,
      createdBy: req.user._id,
      facilities: req.body.facilities || [],
    });

    res.status(201).json({ success: true, message: 'Venue created.', venue: serializeVenue(venue) });
  } catch (error) {
    next(error);
  }
};

const getVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      const error = new Error('Venue not found.');
      error.statusCode = 404;
      throw error;
    }
    const event = await Event.findById(venue.event);
    if (!event) {
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }
    if (!canReadEvent(req.user, event)) {
      const error = new Error('You do not have access to this venue.');
      error.statusCode = 403;
      throw error;
    }
    res.json({ success: true, data: serializeVenue(venue) });
  } catch (error) {
    next(error);
  }
};

const updateVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      const error = new Error('Venue not found.');
      error.statusCode = 404;
      throw error;
    }
    const event = await Event.findById(venue.event);
    if (!event) {
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }
    if (!canManageEvent(req.user, event)) {
      const error = new Error('You do not have permission to modify this venue.');
      error.statusCode = 403;
      throw error;
    }
    const name = req.body.name?.trim();
    if (name && name !== venue.name) {
      const duplicate = await Venue.findOne({ event: event._id, name: new RegExp(`^${name}$`, 'i'), _id: { $ne: venue._id } });
      if (duplicate) {
        const error = new Error('A venue with this name already exists for this event.');
        error.statusCode = 409;
        throw error;
      }
    }

    Object.assign(venue, req.body);
    const updated = await venue.save();
    res.json({ success: true, message: 'Venue updated.', venue: serializeVenue(updated) });
  } catch (error) {
    next(error);
  }
};

const deleteVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      const error = new Error('Venue not found.');
      error.statusCode = 404;
      throw error;
    }
    const event = await Event.findById(venue.event);
    if (!event) {
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }
    if (!canManageEvent(req.user, event)) {
      const error = new Error('You do not have permission to delete this venue.');
      error.statusCode = 403;
      throw error;
    }
    const sessions = await Session.exists({ venue: venue._id });
    if (sessions) {
      const error = new Error('Cannot delete this venue because sessions are assigned to it.');
      error.statusCode = 409;
      throw error;
    }

    await venue.deleteOne();
    res.json({ success: true, message: 'Venue deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listVenues, createVenue, getVenue, updateVenue, deleteVenue };
