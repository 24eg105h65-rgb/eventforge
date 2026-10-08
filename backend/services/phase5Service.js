const crypto = require('node:crypto');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Registration = require('../models/Registration');
const Coupon = require('../models/Coupon');

const VALID_USER_ROLES = ['platform_admin', 'organizer', 'staff', 'speaker', 'attendee', 'sponsor'];
const CAPACITY_CONSUMING = new Set(['PENDING', 'CONFIRMED']);
const ACTIVE_REGISTRATION = new Set(['PENDING', 'CONFIRMED']);

const isEventAccessible = (user, event) => {
  if (user.role === 'platform_admin') return true;
  if (!event) return false;
  if (user.role === 'organizer' || user.role === 'staff') {
    return user._id.toString() === event.createdBy?.toString() || user._id.toString() === event.organizer?.toString();
  }
  return true;
};

const isEventManager = (user, event) => {
  if (user.role === 'platform_admin') return true;
  if (!event) return false;
  if (user.role === 'staff') return false;
  return user._id.toString() === event.createdBy?.toString() || user._id.toString() === event.organizer?.toString();
};

const isEventReader = (user, event) => {
  if (user.role === 'platform_admin') return true;
  if (!event) return false;
  if (user.role === 'organizer' || user.role === 'staff') {
    return user._id.toString() === event.createdBy?.toString() || user._id.toString() === event.organizer?.toString();
  }
  return true;
};

const getEventForTicketRequest = async (user, eventId, permission) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  const allowed = permission === 'read' ? isEventReader(user, event) : isEventManager(user, event);
  if (!allowed) {
    const error = new Error('You do not have access to this event.');
    error.statusCode = 403;
    throw error;
  }

  return event;
};

const getTicketForEvent = async (eventId, ticketId) => {
  const ticket = await Ticket.findOne({ _id: ticketId, event: eventId });
  if (!ticket) {
    const error = new Error('Ticket not found for this event.');
    error.statusCode = 404;
    throw error;
  }
  return ticket;
};

const computeCoupon = (coupon, subtotal) => {
  if (!coupon || !coupon.active || subtotal <= 0) return { discount: 0, total: subtotal, coupon: null };

  const now = new Date();
  const validFrom = coupon.validFrom ? new Date(coupon.validFrom) : null;
  const validUntil = coupon.validUntil ? new Date(coupon.validUntil) : null;
  if (validFrom && now < validFrom) {
    const error = new Error('Coupon is not active yet.');
    error.statusCode = 422;
    throw error;
  }
  if (validUntil && now > validUntil) {
    const error = new Error('Coupon has expired.');
    error.statusCode = 422;
    throw error;
  }
  if (coupon.minimumAmount && subtotal < coupon.minimumAmount) {
    const error = new Error('Coupon minimum purchase amount not met.');
    error.statusCode = 422;
    throw error;
  }

  let discount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    const rawDiscount = subtotal * (coupon.discountValue / 100);
    discount = Math.round(rawDiscount * 100) / 100;
  }
  if (coupon.discountType === 'FIXED') {
    discount = Math.min(coupon.discountValue, subtotal);
  }

  return {
    discount: Number(discount.toFixed(2)),
    total: Math.max(subtotal - discount, 0),
    coupon,
  };
};

const generateRegistrationCode = () => {
  const value = crypto.randomBytes(5).toString('base64url').replace(/[^A-Z0-9]/g, '').slice(0, 7).padEnd(7, '0');
  return `EVF-${value || crypto.randomInt(1000000, 9999999).toString().padStart(7, '0')}`;
};

const getTicketInventory = async (ticket) => {
  const confirmedSales = await Registration.aggregate([
    { $match: { ticket: ticket._id, status: { $in: [...CAPACITY_CONSUMING] } } },
    { $group: { _id: null, quantity: { $sum: '$quantity' } } },
  ]);
  const consumed = confirmedSales[0]?.quantity || 0;
  return { capacity: ticket.capacity, consumed, remaining: Math.max(ticket.capacity - consumed, 0) };
};

const ensureRegistrationAllowed = async (ticket, quantity, attendeeId, eventId, excludeId = null) => {
  if (!ticket.active) {
    const error = new Error('This ticket is inactive.');
    error.statusCode = 422;
    throw error;
  }

  const now = new Date();
  if (ticket.saleStart && now < new Date(ticket.saleStart)) {
    const error = new Error('Ticket sales have not opened yet.');
    error.statusCode = 422;
    throw error;
  }
  if (ticket.saleEnd && now > new Date(ticket.saleEnd)) {
    const error = new Error('Ticket sales have ended.');
    error.statusCode = 422;
    throw error;
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    const error = new Error('Registration quantity must be greater than zero.');
    error.statusCode = 422;
    throw error;
  }
  if (quantity > ticket.maxPerAttendee) {
    const error = new Error(`You may purchase at most ${ticket.maxPerAttendee} of this ticket.`);
    error.statusCode = 422;
    throw error;
  }

  const existing = await Registration.findOne({
    event: eventId,
    ticket: ticket._id,
    attendee: attendeeId,
    status: { $in: [...ACTIVE_REGISTRATION, 'WAITLISTED'] },
    _id: { $ne: excludeId },
  });

  if (existing) {
    const error = new Error('You already have an active registration for this ticket.');
    error.statusCode = 409;
    throw error;
  }

  const inventory = await getTicketInventory(ticket);
  if (quantity > inventory.remaining && !ticket.requiresApproval) {
    return { waitlist: true };
  }

  if (ticket.requiresApproval && quantity > ticket.capacity) {
    const error = new Error('Registration exceeds the available ticket capacity.');
    error.statusCode = 409;
    throw error;
  }

  return { waitlist: false };
};

const resolveCoupon = async (eventId, couponCode, subtotal) => {
  if (!couponCode) return null;
  const normalizedCode = String(couponCode).trim().toUpperCase();
  const coupon = await Coupon.findOne({ event: eventId, code: normalizedCode, active: true });
  if (!coupon) {
    const error = new Error('Coupon not found or inactive.');
    error.statusCode = 422;
    throw error;
  }

  if (coupon.usedCount >= coupon.maxUses) {
    const error = new Error('Coupon usage limit reached.');
    error.statusCode = 409;
    throw error;
  }

  return computeCoupon(coupon, subtotal);
};

const transitionRegistrationStatus = async (registration, nextStatus, user, action) => {
  const transitions = {
    PENDING: new Set(['CONFIRMED', 'REJECTED', 'CANCELLED']),
    CONFIRMED: new Set(['CANCELLED']),
    WAITLISTED: new Set(['CONFIRMED', 'CANCELLED']),
    REJECTED: new Set([]),
    CANCELLED: new Set([]),
  };

  if (!transitions[registration.status]?.has(nextStatus)) {
    const error = new Error(`Invalid registration transition: ${registration.status} -> ${nextStatus}.`);
    error.statusCode = 409;
    throw error;
  }

  registration.status = nextStatus;
  if (nextStatus === 'CONFIRMED') registration.approvedAt = new Date();
  if (nextStatus === 'CANCELLED') registration.cancelledAt = new Date();
  if (nextStatus === 'CANCELLED') registration.cancelledBy = user._id;
  return registration.save();
};

const promoteWaitlist = async (ticketId, eventId) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) return null;

  const inventory = await getTicketInventory(ticket);
  if (inventory.remaining <= 0) return null;

  const waitlist = await Registration.findOne({
    event: eventId,
    ticket: ticketId,
    status: 'WAITLISTED',
    quantity: { $lte: inventory.remaining },
  }).sort({ createdAt: 1 });

  if (!waitlist) return null;

  await Registration.findByIdAndUpdate(waitlist._id, { status: 'CONFIRMED', approvedAt: new Date(), cancelledAt: null, cancelledBy: null });
  return Registration.findById(waitlist._id);
};

const serializeTicket = (ticket) => ({
  ...ticket.toObject(),
  _id: ticket._id.toString(),
  event: ticket.event?.toString(),
  createdBy: ticket.createdBy?.toString(),
  remainingCount: Math.max(ticket.capacity - ticket.soldCount, 0),
});

const serializeRegistration = (registration, includeTicket = false) => ({
  ...registration.toObject(),
  _id: registration._id.toString(),
  event: registration.event?.toString(),
  ticket: registration.ticket && typeof registration.ticket === 'object' && typeof registration.ticket.toObject === 'function'
    ? serializeTicket(registration.ticket)
    : registration.ticket?.toString() || registration.ticket,
  // Preserve the populated attendee object (name, email, role) if available
  attendee: registration.attendee && typeof registration.attendee === 'object' && registration.attendee.name
    ? { _id: registration.attendee._id?.toString(), name: registration.attendee.name, email: registration.attendee.email, role: registration.attendee.role }
    : registration.attendee?.toString() || registration.attendee,
  coupon: registration.coupon?.toString() || registration.coupon,
  cancelledBy: registration.cancelledBy?.toString() || registration.cancelledBy,
  ticketDetails: includeTicket ? registration.ticketDetails || null : undefined,
});

const applyRegistrationInventory = async (ticketId, quantity, registrationId = null) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const error = new Error('Ticket not found.');
    error.statusCode = 404;
    throw error;
  }

  const pending = await Registration.aggregate([
    { $match: { ticket: ticket._id, status: { $in: [...CAPACITY_CONSUMING] }, _id: { $ne: registrationId || new mongoose.Types.ObjectId() } } },
    { $group: { _id: null, quantity: { $sum: '$quantity' } } },
  ]);

  const consumed = pending[0]?.quantity || 0;
  if (consumed + quantity > ticket.capacity) {
    const error = new Error('Ticket capacity would be exceeded.');
    error.statusCode = 409;
    throw error;
  }

  ticket.soldCount = consumed + quantity;
  await ticket.save();
};

const releaseRegistrationInventory = async (registration) => {
  const ticket = await Ticket.findById(registration.ticket);
  if (!ticket) return;

  const otherStatus = await Registration.aggregate([
    { $match: { ticket: ticket._id, status: { $in: [...CAPACITY_CONSUMING] }, _id: { $ne: registration._id } } },
    { $group: { _id: null, quantity: { $sum: '$quantity' } } },
  ]);

  ticket.soldCount = otherStatus[0]?.quantity || 0;
  await ticket.save();
};

module.exports = {
  VALID_USER_ROLES,
  ACTIVE_REGISTRATION,
  CAPACITY_CONSUMING,
  isEventAccessible,
  isEventManager,
  isEventReader,
  getEventForTicketRequest,
  getTicketForEvent,
  generateRegistrationCode,
  resolveCoupon,
  computeCoupon,
  ensureRegistrationAllowed,
  transitionRegistrationStatus,
  promoteWaitlist,
  serializeTicket,
  serializeRegistration,
  applyRegistrationInventory,
  releaseRegistrationInventory,
};
