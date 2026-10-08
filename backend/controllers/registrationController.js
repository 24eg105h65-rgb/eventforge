const Registration = require('../models/Registration');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const Coupon = require('../models/Coupon');
const {
  getEventForTicketRequest,
  getTicketForEvent,
  resolveCoupon,
  generateRegistrationCode,
  ensureRegistrationAllowed,
  transitionRegistrationStatus,
  applyRegistrationInventory,
  releaseRegistrationInventory,
  promoteWaitlist,
  serializeRegistration,
} = require('../services/phase5Service');

const getEventRegistrations = async (req, res, next) => {
  try {
    const event = await getEventForTicketRequest(req.user, req.params.id, 'manage');
    const query = { event: event._id };
    if (req.query.status) query.status = req.query.status;
    if (req.query.ticket) query.ticket = req.query.ticket;

    const registrations = await Registration.find(query)
      .populate('ticket', 'name type price currency capacity soldCount requiresApproval')
      .populate('attendee', 'name email role')
      .populate('coupon', 'code discountType discountValue')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: registrations.map((registration) => serializeRegistration(registration, true)) });
  } catch (error) {
    next(error);
  }
};

const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ attendee: req.user._id })
      .populate('event', 'name')
      .populate('ticket', 'name type price currency')
      .sort({ registeredAt: -1 });

    res.json({ success: true, data: registrations.map((registration) => serializeRegistration(registration, true)) });
  } catch (error) {
    next(error);
  }
};

const createRegistration = async (req, res, next) => {
  try {
    const event = await getEventForTicketRequest(req.user, req.params.id, 'read');
    const ticket = await getTicketForEvent(event._id, req.body.ticketId);
    const availability = await ensureRegistrationAllowed(ticket, req.body.quantity, req.user._id, event._id);

    const unitPrice = Number(ticket.price || 0);
    const subtotal = Number(unitPrice * req.body.quantity);
    const couponResult = await resolveCoupon(event._id, req.body.couponCode, subtotal);
    const totalAmount = couponResult ? couponResult.total : subtotal;
    const discount = couponResult ? couponResult.discount : 0;

    const status = ticket.requiresApproval ? 'PENDING' : availability.waitlist ? 'WAITLISTED' : 'CONFIRMED';
    const registration = await Registration.create({
      event: event._id,
      ticket: ticket._id,
      attendee: req.user._id,
      attendeeDetails: req.body.attendeeDetails || {},
      quantity: req.body.quantity,
      unitPrice,
      subtotal,
      discount,
      totalAmount,
      currency: ticket.currency,
      coupon: couponResult?.coupon?._id || null,
      status,
      registrationCode: generateRegistrationCode(),
      notes: req.body.notes || '',
    });

    if (status === 'CONFIRMED') {
      await applyRegistrationInventory(ticket._id, req.body.quantity);
      if (couponResult?.coupon) {
        await Coupon.findByIdAndUpdate(couponResult.coupon._id, { $inc: { usedCount: 1 } });
      }
    }

    const populated = await Registration.findById(registration._id)
      .populate('ticket', 'name type price currency capacity soldCount remains')
      .populate('coupon', 'code discountType discountValue');

    res.status(201).json({ success: true, message: 'Registration created.', data: serializeRegistration(populated, true) });
  } catch (error) {
    next(error);
  }
};

const getRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('event', 'name')
      .populate('ticket', 'name type price currency capacity soldCount')
      .populate('attendee', 'name email role')
      .populate('coupon', 'code discountType discountValue');

    if (!registration) {
      const error = new Error('Registration not found.');
      error.statusCode = 404;
      throw error;
    }

    const event = await Event.findById(registration.event._id);
    const isOrganizer = req.user.role === 'platform_admin' || (event && (event.createdBy.toString() === req.user._id.toString() || event.organizer.toString() === req.user._id.toString()));
    const isAttendee = req.user._id.toString() === registration.attendee._id.toString();
    if (!isOrganizer && !isAttendee) {
      const error = new Error('You do not have access to this registration.');
      error.statusCode = 403;
      throw error;
    }

    res.json({ success: true, data: serializeRegistration(registration, true) });
  } catch (error) {
    next(error);
  }
};

const updateRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      const error = new Error('Registration not found.');
      error.statusCode = 404;
      throw error;
    }

    const event = await Event.findById(registration.event);
    const canManage = req.user.role === 'platform_admin' || (event && (event.createdBy.toString() === req.user._id.toString() || event.organizer.toString() === req.user._id.toString()));
    if (!canManage) {
      const error = new Error('You do not have permission to update this registration.');
      error.statusCode = 403;
      throw error;
    }

    if (req.body.status) {
      await transitionRegistrationStatus(registration, req.body.status, req.user, 'update');
      if (req.body.status === 'CANCELLED') await releaseRegistrationInventory(registration);
      if (req.body.status === 'CONFIRMED' && registration.status === 'WAITLISTED') await applyRegistrationInventory(registration.ticket, registration.quantity, registration._id);
    }
    if (req.body.notes !== undefined) registration.notes = req.body.notes;
    await registration.save();

    const updated = await Registration.findById(registration._id).populate('ticket', 'name type price currency capacity soldCount');
    res.json({ success: true, message: 'Registration updated.', data: serializeRegistration(updated, true) });
  } catch (error) {
    next(error);
  }
};

const approveRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      const error = new Error('Registration not found.');
      error.statusCode = 404;
      throw error;
    }
    const event = await Event.findById(registration.event);
    const canManage = req.user.role === 'platform_admin' || (event && (event.createdBy.toString() === req.user._id.toString() || event.organizer.toString() === req.user._id.toString()));
    if (!canManage) {
      const error = new Error('You do not have permission to approve this registration.');
      error.statusCode = 403;
      throw error;
    }
    const updated = await transitionRegistrationStatus(registration, 'CONFIRMED', req.user, 'approve');
    if (registration.status !== 'CONFIRMED') await applyRegistrationInventory(registration.ticket, registration.quantity, registration._id);
    const coupon = registration.coupon ? await Coupon.findById(registration.coupon) : null;
    if (coupon && registration.status !== 'CONFIRMED') await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
    const populated = await Registration.findById(updated._id).populate('ticket', 'name type price currency capacity soldCount').populate('coupon', 'code discountType discountValue');
    res.json({ success: true, message: 'Registration approved.', data: serializeRegistration(populated, true) });
  } catch (error) {
    next(error);
  }
};

const cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      const error = new Error('Registration not found.');
      error.statusCode = 404;
      throw error;
    }

    const event = await Event.findById(registration.event);
    const isOwner = registration.attendee.toString() === req.user._id.toString();
    const canManage = req.user.role === 'platform_admin' || (event && (event.createdBy.toString() === req.user._id.toString() || event.organizer.toString() === req.user._id.toString()));
    if (!isOwner && !canManage) {
      const error = new Error('You do not have permission to cancel this registration.');
      error.statusCode = 403;
      throw error;
    }

    const updated = await transitionRegistrationStatus(registration, 'CANCELLED', req.user, 'cancel');
    await releaseRegistrationInventory(updated);
    const ticket = await Ticket.findById(updated.ticket);
    const promoted = await promoteWaitlist(ticket._id, event._id);
    if (promoted) {
      await applyRegistrationInventory(ticket._id, promoted.quantity, promoted._id);
    }
    res.json({ success: true, message: 'Registration cancelled.', data: serializeRegistration(updated, true) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEventRegistrations,
  getMyRegistrations,
  createRegistration,
  getRegistration,
  updateRegistration,
  approveRegistration,
  cancelRegistration,
};
