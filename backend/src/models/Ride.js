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
  status: {
    type: String,
    enum: ['searching', 'accepted', 'started', 'completed', 'cancelled'],
    default: 'searching',
  },
  otp: String, // For ride start verification
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
