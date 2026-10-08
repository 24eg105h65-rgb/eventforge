const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 180,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 8000,
    },
    eventType: {
      type: String,
      enum: ['conference', 'workshop', 'exhibition', 'seminar', 'networking', 'corporate', 'summit', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
      default: 'draft',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    venue: {
      type: String,
      default: '',
      trim: true,
      maxlength: 180,
    },
    address: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },
    city: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100,
    },
    country: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    registrationOpen: {
      type: Date,
      default: null,
    },
    registrationClose: {
      type: Date,
      default: null,
    },
    bannerImage: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    website: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },
    contactEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid contact email.'],
    },
  },
  { timestamps: true },
);

eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ name: 'text', description: 'text', city: 'text', venue: 'text' });

eventSchema.pre('validate', function validateDates() {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date must be on or after the start date.');
  }

  if (this.registrationOpen && this.registrationClose && this.registrationClose > this.startDate) {
    this.invalidate('registrationClose', 'Registration close cannot be after the event start date.');
  }

  if (this.registrationOpen && this.registrationClose && this.registrationClose < this.registrationOpen) {
    this.invalidate('registrationClose', 'Registration close must be after registration open.');
  }
});

module.exports = mongoose.model('Event', eventSchema);
