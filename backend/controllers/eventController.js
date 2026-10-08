const Event = require('../models/Event');
const User = require('../models/User');

const getEventScope = (user) => {
  if (user.role === 'platform_admin') {
    return {};
  }

  if (user.role === 'attendee' || user.role === 'speaker' || user.role === 'sponsor') {
    return {};
  }

  return {
    $or: [{ organizer: user._id }, { createdBy: user._id }],
  };
};

const canModifyEvent = (user, event) => {
  if (user.role === 'platform_admin') return true;
  if (!event || !event.createdBy || user._id.toString() !== event.createdBy.toString()) return false;
  return true;
};

const serializeEvent = (event) => {
  if (!event) return null;

  return {
    ...event.toObject(),
    _id: event._id.toString(),
    organizer: event.organizer?.toString(),
    createdBy: event.createdBy?.toString(),
  };
};

const getEventQuery = (user, eventId) => {
  const baseQuery = { _id: eventId };
  const scope = getEventScope(user);
  return user.role === 'platform_admin' ? { ...baseQuery } : { ...baseQuery, ...scope };
};

const createSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'event';

const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne(getEventQuery(req.user, req.params.id))
      .populate('organizer', 'name email role')
      .populate('createdBy', 'name email role');

    if (!event) {
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }

    res.json({ success: true, data: serializeEvent(event) });
  } catch (error) {
    next(error);
  }
};

const listEvents = async (req, res, next) => {
  try {
    const { search, status, eventType, page, limit } = req.query;
    const query = getEventScope(req.user);

    if (search) {
      query.$text = { $search: search.trim() };
    }
    if (status) query.status = status;
    if (eventType) query.eventType = eventType;

    const events = await Event.find(query)
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: events.map(serializeEvent),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const organizer = req.body.organizer || req.user._id;
    const organizerUser = await User.findById(organizer);

    if (!organizerUser || !organizerUser.isActive) {
      const error = new Error('Organizer not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!['platform_admin', 'organizer'].includes(req.user.role) && req.user._id.toString() !== organizerUser._id.toString()) {
      const error = new Error('You do not have permission to create events for this organizer.');
      error.statusCode = 403;
      throw error;
    }

    if (req.user.role === 'organizer' && req.user._id.toString() !== organizerUser._id.toString()) {
      const error = new Error('Organizers can only create events for themselves.');
      error.statusCode = 403;
      throw error;
    }

    const payload = {
      ...req.body,
      organizer,
      createdBy: req.user._id,
      slug: createSlug(req.body.name),
    };
    const event = await Event.create(payload);

    res.status(201).json({ success: true, message: 'Event created.', event: serializeEvent(event) });
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = 'An event with this name already exists.';
    }
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne(getEventQuery(req.user, req.params.id));
    if (!event) {
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!canModifyEvent(req.user, event)) {
      const error = new Error('You do not have permission to modify this event.');
      error.statusCode = 403;
      throw error;
    }

    Object.assign(event, req.body);
    const updatedEvent = await event.save();

    res.json({ success: true, message: 'Event updated.', event: serializeEvent(updatedEvent) });
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = 'An event with this name already exists.';
    }
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne(getEventQuery(req.user, req.params.id));
    if (!event) {
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!canModifyEvent(req.user, event)) {
      const error = new Error('You do not have permission to delete this event.');
      error.statusCode = 403;
      throw error;
    }

    await event.deleteOne();
    res.json({ success: true, message: 'Event deleted.' });
  } catch (error) {
    next(error);
  }
};

const getEventOverview = async (req, res, next) => {
  try {
    const event = await Event.findOne(getEventQuery(req.user, req.params.id));
    if (!event) {
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }

    const totalRegistrations = 0;
    const totalAttendance = 0;
    const totalSessions = 0;
    const totalSpeakers = 0;
    const totalSponsors = 0;

    res.json({
      success: true,
      data: {
        eventId: event._id.toString(),
        totalSessions,
        totalSpeakers,
        totalSponsors,
        totalRegistrations,
        totalAttendance,
        capacity: event.capacity,
        registrationPercentage: event.capacity > 0 ? (totalRegistrations / event.capacity) * 100 : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createEvent, listEvents, getEvent, updateEvent, deleteEvent, getEventOverview };
