const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'redeemed', 'expired'],
    default: 'active'
  },
  savedAt: {
    type: Date,
    default: Date.now
  },
  redeemedAt: {
    type: Date
  }
});

// Prevent duplicate saves of the same campaign by the same user
couponSchema.index({ userId: 1, campaignId: 1 }, { unique: true });

module.exports = mongoose.model('Coupon', couponSchema);
