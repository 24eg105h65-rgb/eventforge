const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 4000,
    },
    building: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    floor: {
      type: String,
      default: '',
      trim: true,
      maxlength: 40,
    },
    roomNumber: {
      type: String,
      default: '',
      trim: true,
      maxlength: 60,
    },
    address: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    facilities: [{ type: String, trim: true, lowercase: true }],
    seatingType: {
      type: String,
      enum: ['theatre', 'classroom', 'boardroom', 'u-shape', 'banquet', 'standing', 'other'],
      default: 'other',
    },
    isActive: {
      type: Boolean,
      default: true,
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

venueSchema.index({ event: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Venue', venueSchema);
