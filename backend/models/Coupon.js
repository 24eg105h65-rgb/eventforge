const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxUses: { type: Number, default: 1, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },
    minimumAmount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

couponSchema.index({ event: 1, code: 1 }, { unique: true });
couponSchema.index({ event: 1, active: 1 });

couponSchema.pre('validate', function validateCoupon() {
  if (this.discountType === 'PERCENTAGE' && (this.discountValue < 0 || this.discountValue > 100)) {
    this.invalidate('discountValue', 'Percentage discount must be between 0 and 100.');
  }
  if (this.discountType === 'FIXED' && this.discountValue < 0) {
    this.invalidate('discountValue', 'Fixed discount cannot be negative.');
  }
  if (this.validFrom && this.validUntil && this.validUntil <= this.validFrom) {
    this.invalidate('validUntil', 'Coupon expiration must be after the start date.');
  }
});

module.exports = mongoose.model('Coupon', couponSchema);
