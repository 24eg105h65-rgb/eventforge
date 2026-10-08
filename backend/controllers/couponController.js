const Coupon = require('../models/Coupon');
const { getEventForTicketRequest } = require('../services/phase5Service');

const listCoupons = async (req, res, next) => {
  try {
    const event = await getEventForTicketRequest(req.user, req.params.id, 'read');
    const coupons = await Coupon.find({ event: event._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const event = await getEventForTicketRequest(req.user, req.params.id, 'manage');
    const normalizedCode = req.body.code.trim().toUpperCase();
    const existing = await Coupon.findOne({ event: event._id, code: normalizedCode });
    if (existing) {
      const error = new Error('A coupon with this code already exists for this event.');
      error.statusCode = 409;
      throw error;
    }

    const coupon = await Coupon.create({ ...req.body, event: event._id, code: normalizedCode, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Coupon created.', data: coupon });
  } catch (error) {
    if (error.name === 'ValidationError') {
      error.statusCode = 422;
      error.details = Object.values(error.errors).map((issue) => ({ field: issue.path, message: issue.message }));
    }
    next(error);
  }
};

const getCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      const error = new Error('Coupon not found.');
      error.statusCode = 404;
      throw error;
    }
    const event = await getEventForTicketRequest(req.user, coupon.event.toString(), 'read');
    res.json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      const error = new Error('Coupon not found.');
      error.statusCode = 404;
      throw error;
    }
    await getEventForTicketRequest(req.user, coupon.event.toString(), 'manage');
    Object.assign(coupon, req.body);
    if (req.body.code) coupon.code = req.body.code.trim().toUpperCase();
    const updated = await coupon.save();
    res.json({ success: true, message: 'Coupon updated.', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      const error = new Error('Coupon not found.');
      error.statusCode = 404;
      throw error;
    }
    await getEventForTicketRequest(req.user, coupon.event.toString(), 'manage');
    await coupon.deleteOne();
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listCoupons, createCoupon, getCoupon, updateCoupon, deleteCoupon };
