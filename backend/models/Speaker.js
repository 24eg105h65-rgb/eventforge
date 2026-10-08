const mongoose = require('mongoose');

const speakerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 140,
    },
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 140,
    },
    company: {
      type: String,
      default: '',
      trim: true,
      maxlength: 140,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: 4000,
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Speaker', speakerSchema);
