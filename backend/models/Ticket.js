const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 180 },
    description: { type: String, default: '', trim: true, maxlength: 4000 },
    type: { type: String, enum: ['FREE', 'PAID', 'VIP', 'EARLY_BIRD', 'STUDENT', 'CORPORATE', 'GROUP', 'CUSTOM'], default: 'PAID' },
    price: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, default: 'INR', trim: true, uppercase: true, maxlength: 10 },
    capacity: { type: Number, required: true, min: 1 },
    soldCount: { type: Number, default: 0, min: 0 },
    saleStart: { type: Date, default: null },
    saleEnd: { type: Date, default: null },
    active: { type: Boolean, default: true },
    requiresApproval: { type: Boolean, default: false },
    maxPerAttendee: { type: Number, min: 1, default: 1 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

ticketSchema.index({ event: 1, active: 1 });
ticketSchema.index({ event: 1, name: 1 });

ticketSchema.virtual('remainingCount').get(function remainingCount() {
  return Math.max(this.capacity - this.soldCount, 0);
});

ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

ticketSchema.pre('validate', function validateDates() {
  if (this.saleStart && this.saleEnd && this.saleEnd <= this.saleStart) {
    this.invalidate('saleEnd', 'Sale end must be after sale start.');
  }
});

ticketSchema.pre('save', function validateSavedTicket() {
  if (this.soldCount > this.capacity) {
    this.invalidate('soldCount', 'Ticket sold count cannot exceed capacity.');
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);
