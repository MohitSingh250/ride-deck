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
  email: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined but unique if present
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
  subscriptionExpiry: Date,
  isOnline: {
    type: Boolean,
    default: false,
  },
  currentLocation: {
    lat: Number,
    lng: Number,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
