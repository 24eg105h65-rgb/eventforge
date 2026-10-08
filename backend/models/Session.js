const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 180,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 8000,
    },
    sessionType: {
      type: String,
      enum: ['keynote', 'workshop', 'panel', 'talk', 'networking', 'breakout', 'fireside-chat', 'other'],
      default: 'other',
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
      index: true,
    },
    speakers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Speaker', index: true }],
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      min: 1,
      default: 0,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'live', 'completed', 'cancelled'],
      default: 'draft',
    },
    track: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    materials: [{ type: String, trim: true }],
    livestreamUrl: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    recordingUrl: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

sessionSchema.index({ event: 1, startTime: 1 });
sessionSchema.index({ venue: 1, startTime: 1, endTime: 1 });

sessionSchema.pre('validate', function validateTimes() {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    this.invalidate('endTime', 'End time must be after the start time.');
  }

  if (this.startTime && this.endTime) {
    this.duration = Math.max(1, Math.round((this.endTime - this.startTime) / 60000));
  }
});

module.exports = mongoose.model('Session', sessionSchema);
