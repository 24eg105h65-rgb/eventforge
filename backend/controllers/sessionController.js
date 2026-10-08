const Event = require('../models/Event');
const Session = require('../models/Session');
const Speaker = require('../models/Speaker');
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

const getEventForSessionRequest = async (user, eventId, permission) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }
  const allowed = permission === 'read' ? canReadEvent(user, event) : canManageEvent(user, event);
  if (!allowed) {
    const error = new Error('You do not have access to this event.');
    error.statusCode = 403;
    throw error;
  }
  return event;
};

const serializeSession = (session) => ({
  ...session.toObject(),
  _id: session._id.toString(),
  event: session.event?.toString(),
  venue: session.venue?.toString(),
  speakers: session.speakers?.map((speaker) => speaker.toString()),
  createdBy: session.createdBy?.toString(),
});

const overlaps = (startA, endA, startB, endB) => startA < endB && endA > startB;

const findVenueConflict = async (venueId, startTime, endTime, excludeSessionId = null) => {
  const query = {
    venue: venueId,
    _id: { $ne: excludeSessionId },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  return Session.findOne(query).populate('venue', 'name');
};

const findSpeakerConflict = async (speakerIds, startTime, endTime, excludeSessionId = null) => {
  if (!speakerIds.length) return null;
  const query = {
    speakers: { $in: speakerIds },
    _id: { $ne: excludeSessionId },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  return Session.findOne(query).populate('speakers', 'displayName');
};

const resolveSessionVenue = async (event, venueId, user) => {
  if (!venueId) {
    const error = new Error('A venue is required.');
    error.statusCode = 422;
    throw error;
  }

  const venue = await Venue.findOne({ _id: venueId, event: event._id });
  if (!venue) {
    const error = new Error('Venue not found for this event.');
    error.statusCode = 422;
    throw error;
  }

  if (!venue.isActive) {
    const error = new Error('This venue is inactive and cannot host sessions.');
    error.statusCode = 422;
    throw error;
  }

  if (venue.capacity < (Number(user.capacity) || venue.capacity)) {
    const error = new Error(`Session capacity cannot exceed the venue capacity of ${venue.capacity}.`);
    error.statusCode = 422;
    throw error;
  }

  return venue;
};

const validateSpeakers = async (speakerIds) => {
  const ids = [...new Set(speakerIds.map((id) => id.toString()))];
  if (!ids.length) return [];

  const speakerDocuments = await Speaker.find({
    $or: [{ _id: { $in: ids } }, { user: { $in: ids } }],
  }).select('_id user isActive displayName');

  const mappedIds = new Map();
  speakerDocuments.forEach((speaker) => {
    mappedIds.set(speaker._id.toString(), speaker);
    mappedIds.set(speaker.user.toString(), speaker);
  });

  const resolved = ids.map((id) => mappedIds.get(id)).filter(Boolean);
  if (resolved.length !== ids.length) {
    const error = new Error('One or more speakers could not be found.');
    error.statusCode = 422;
    throw error;
  }

  const invalid = resolved.filter((speaker) => !speaker.isActive);
  if (invalid.length) {
    const error = new Error('One or more speakers are inactive.');
    error.statusCode = 422;
    throw error;
  }
  return resolved;
};

const normalizeSessionPayload = async (event, payload) => {
  const venue = await resolveSessionVenue(event, payload.venue, payload);
  const speakers = await validateSpeakers(payload.speakers || []);
  const startTime = new Date(payload.startTime);
  const endTime = new Date(payload.endTime);

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    const error = new Error('Session start and end times must be valid dates.');
    error.statusCode = 422;
    throw error;
  }

  if (endTime <= startTime) {
    const error = new Error('End time must be after the start time.');
    error.statusCode = 422;
    throw error;
  }

  const capacity = payload.capacity ?? venue.capacity;
  if (capacity > venue.capacity) {
    const error = new Error(`Session capacity cannot exceed the venue capacity of ${venue.capacity}.`);
    error.statusCode = 422;
    throw error;
  }

  return {
    ...payload,
    event: event._id,
    venue: venue._id,
    capacity,
    speakers: speakers.map((speaker) => speaker._id),
    startTime,
    endTime,
  };
};

const listSessions = async (req, res, next) => {
  try {
    const event = await getEventForSessionRequest(req.user, req.params.id, 'read');
    const sessions = await Session.find({ event: event._id })
      .populate('venue', 'name roomNumber building capacity isActive')
      .populate('speakers', 'displayName title company')
      .sort({ startTime: 1 });
    res.json({ success: true, data: sessions.map(serializeSession) });
  } catch (error) {
    next(error);
  }
};

const createSession = async (req, res, next) => {
  try {
    const event = await getEventForSessionRequest(req.user, req.params.id, 'manage');
    const normalized = await normalizeSessionPayload(event, req.body);
    const venueConflict = await findVenueConflict(normalized.venue, normalized.startTime, normalized.endTime);
    if (venueConflict) {
      const error = new Error(`Venue conflict: ${venueConflict.venue?.name || 'This room'} is already occupied from ${new Date(venueConflict.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(venueConflict.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
      error.statusCode = 409;
      error.message = 'Venue conflict';
      error.details = `Room ${venueConflict.venue?.name || 'selected'} is already occupied from ${new Date(venueConflict.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(venueConflict.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
      throw error;
    }

    const speakerConflict = await findSpeakerConflict(normalized.speakers, normalized.startTime, normalized.endTime);
    if (speakerConflict) {
      const error = new Error('Speaker conflict');
      error.details = `${speakerConflict.speakers?.[0]?.displayName || 'A speaker'} is already assigned to an overlapping session.`;
      error.statusCode = 409;
      throw error;
    }

    const session = await Session.create({ ...normalized, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Session created.', data: serializeSession(session) });
  } catch (error) {
    next(error);
  }
};

const getSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('event', 'name status')
      .populate('venue', 'name roomNumber building capacity isActive')
      .populate('speakers', 'displayName title company');
    if (!session) {
      const error = new Error('Session not found.');
      error.statusCode = 404;
      throw error;
    }
    const event = await Event.findById(session.event._id || session.event);
    if (!event || !canReadEvent(req.user, event)) {
      const error = new Error('You do not have access to this session.');
      error.statusCode = 403;
      throw error;
    }
    res.json({ success: true, data: serializeSession(session) });
  } catch (error) {
    next(error);
  }
};

const updateSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      const error = new Error('Session not found.');
      error.statusCode = 404;
      throw error;
    }
    const event = await Event.findById(session.event);
    if (!event || !canManageEvent(req.user, event)) {
      const error = new Error('You do not have permission to modify this session.');
      error.statusCode = 403;
      throw error;
    }

    const nextPayload = { ...session.toObject(), ...req.body };
    const normalized = await normalizeSessionPayload(event, nextPayload);
    const venueConflict = await findVenueConflict(normalized.venue, normalized.startTime, normalized.endTime, session._id);
    if (venueConflict) {
      const error = new Error('Venue conflict');
      error.details = `Room ${venueConflict.venue?.name || 'selected'} is already occupied from ${new Date(venueConflict.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(venueConflict.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
      error.statusCode = 409;
      throw error;
    }

    const speakerConflict = await findSpeakerConflict(normalized.speakers, normalized.startTime, normalized.endTime, session._id);
    if (speakerConflict) {
      const error = new Error('Speaker conflict');
      error.details = `${speakerConflict.speakers?.[0]?.displayName || 'A speaker'} is already assigned to an overlapping session.`;
      error.statusCode = 409;
      throw error;
    }

    Object.assign(session, normalized);
    const updated = await session.save();
    res.json({ success: true, message: 'Session updated.', data: serializeSession(updated) });
  } catch (error) {
    next(error);
  }
};

const deleteSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      const error = new Error('Session not found.');
      error.statusCode = 404;
      throw error;
    }
    const event = await Event.findById(session.event);
    if (!event || !canManageEvent(req.user, event)) {
      const error = new Error('You do not have permission to delete this session.');
      error.statusCode = 403;
      throw error;
    }

    await session.deleteOne();
    res.json({ success: true, message: 'Session deleted.' });
  } catch (error) {
    next(error);
  }
};

const getSchedule = async (req, res, next) => {
  try {
    const event = await getEventForSessionRequest(req.user, req.params.id, 'read');
    const { date, venue, sessionType, status, search } = req.query;
    const query = { event: event._id, startTime: { $gte: new Date(date || '1970-01-01') } };

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      query.startTime = { $gte: start, $lte: end };
    }
    if (venue) query.venue = venue;
    if (sessionType) query.sessionType = sessionType;
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const sessions = await Session.find(query)
      .populate('venue', 'name roomNumber building isActive capacity')
      .populate('speakers', 'displayName title company')
      .sort({ startTime: 1, venue: 1 });

    res.json({ success: true, data: sessions.map(serializeSession) });
  } catch (error) {
    next(error);
  }
};

module.exports = { listSessions, createSession, getSession, updateSession, deleteSession, getSchedule };
