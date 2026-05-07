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
  riderOffer: Number,
  offers: [{
    driverId: String, // String for virtual/fallback compatibility
    amount: Number,
    eta: Number,
    driverName: String,
    rating: Number,
    vehicleType: String,
    vehicleNumber: String,
    createdAt: { type: Date, default: Date.now }
  }],
  fallbackDriver: {
    name: String,
    phone: String,
    vehicleNumber: String,
    vehicleType: String,
    rating: Number,
    avatar: String,
    isFallback: { type: Boolean, default: false }
  },
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

rideSchema.pre('save', function() {
  if (!this.otp) {
    this.otp = Math.floor(1000 + Math.random() * 9000).toString();
  }
});

rideSchema.index({ 'pickup': '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);
