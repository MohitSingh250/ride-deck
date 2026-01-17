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
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
    address: String,
  },
  dropoff: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
    address: String,
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'auto', 'cab', 'go', 'premier', 'xl'],
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
    enum: ['searching', 'booked', 'arrived', 'started', 'completed', 'cancelled', 'scheduled'],
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
  riderRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  driverRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  riderReview: String,
  driverReview: String,
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

rideSchema.pre('save', function(next) {
  if (!this.otp) {
    this.otp = Math.floor(1000 + Math.random() * 9000).toString();
  }
  next();
});

rideSchema.index({ 'pickup': '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);
