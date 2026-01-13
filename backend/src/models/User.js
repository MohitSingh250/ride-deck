const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['rider', 'driver', 'admin'],
    default: 'rider',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  profilePicture: String,
  // Driver specific fields
  vehicleType: {
    type: String,
    enum: ['bike', 'auto', 'cab'],
  },
  vehicleNumber: String,
  licenseNumber: String,
  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'none'],
    default: 'none',
  },
  subscriptionType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'none'],
    default: 'none',
  },
  subscriptionExpiry: Date,
  autoRenew: {
    type: Boolean,
    default: false,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  currentLocation: {
    lat: Number,
    lng: Number,
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  bankAccount: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    holderName: String,
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'none'],
    default: 'none',
  },
  kycDocuments: {
    license: String,
    rc: String,
    selfie: String,
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  referralCount: {
    type: Number,
    default: 0,
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
