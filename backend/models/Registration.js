const mongoose = require('mongoose');

const attendeeDetailsSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: '', trim: true, maxlength: 120 },
    email: { type: String, default: '', trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, default: '', trim: true, maxlength: 30 },
    jobTitle: { type: String, default: '', trim: true, maxlength: 120 },
    dietaryRequirements: { type: String, default: '', trim: true, maxlength: 500 },
    specialRequirements: { type: String, default: '', trim: true, maxlength: 1000 },
  },
  { _id: false },
);

const registrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    attendee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    attendeeDetails: { type: attendeeDetailsSchema, default: () => ({}) },
    quantity: { type: Number, required: true, min: 1, max: 100 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', trim: true, uppercase: true, maxlength: 10 },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    status: { type: String, enum: ['PENDING', 'CONFIRMED', 'WAITLISTED', 'REJECTED', 'CANCELLED'], default: 'PENDING', index: true },
    registrationCode: { type: String, required: true, unique: true, index: true },
    registeredAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '', trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

registrationSchema.index({ event: 1, ticket: 1, attendee: 1, status: 1 });
registrationSchema.index({ event: 1, ticket: 1, status: 1, createdAt: 1 });

registrationSchema.pre('validate', function validateAmounts() {
  if (this.subtotal < 0 || this.discount < 0 || this.totalAmount < 0) {
    this.invalidate('totalAmount', 'Registration amounts cannot be negative.');
  }
  if (this.subtotal < this.discount) {
    this.invalidate('discount', 'Coupon discount cannot exceed the subtotal.');
  }
});

module.exports = mongoose.model('Registration', registrationSchema);
