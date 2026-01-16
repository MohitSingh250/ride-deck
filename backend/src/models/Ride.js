const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  pickup: {
    address: String,
    lat: Number,
    lng: Number,
  },
  dropoff: {
    address: String,
    lat: Number,
    lng: Number,
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'auto', 'cab'],
    required: true,
  },
  fare: Number,
  paymentMethod: {
    type: String,
    enum: ['wallet', 'cash'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['searching', 'accepted', 'arrived', 'started', 'completed', 'cancelled', 'scheduled'],
    default: 'searching',
  },
  isScheduled: {
    type: Boolean,
    default: false,
  },
  scheduledTime: {
    type: Date,
  },
  otp: String, // For ride start verification
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  priceLocked: {
    type: Boolean,
    default: true,
  },
  safetyStatus: {
    type: String,
    enum: ['normal', 'anomaly', 'emergency'],
    default: 'normal',
  },
  fareSplit: {
    driver: Number,
    platform: Number,
    brand: Number,
  },
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
