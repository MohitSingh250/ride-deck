const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const User = require('../models/User');
const { auth } = require('../middleware/authMiddleware');

// @route   POST /api/rides/book
// @desc    Book a new ride
// @access  Private
router.post('/book', auth, async (req, res) => {
  const { pickup, dropoff, vehicleType, fare } = req.body;
  const riderId = req.user._id;

  try {
    // Check for existing active ride
    const existingRide = await Ride.findOne({ 
      riderId, 
      status: { $in: ['searching', 'accepted', 'started'] } 
    });

    if (existingRide) {
      return res.status(400).json({ message: 'You already have an active ride.' });
    }

    // Mock coordinates for routing (New Delhi area)
    const pickupLat = 28.6139 + (Math.random() - 0.5) * 0.05;
    const pickupLng = 77.2090 + (Math.random() - 0.5) * 0.05;
    const dropoffLat = 28.6139 + (Math.random() - 0.5) * 0.05;
    const dropoffLng = 77.2090 + (Math.random() - 0.5) * 0.05;

    const ride = new Ride({
      riderId,
      pickup: { 
        address: pickup,
        lat: pickupLat,
        lng: pickupLng
      },
      dropoff: { 
        address: dropoff,
        lat: dropoffLat,
        lng: dropoffLng
      },
      vehicleType,
      fare: fare || 50,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
    });

    await ride.save();

    // Notify all online drivers about the new ride request
    const io = req.app.get('io');
    io.emit('newRideRequest', ride);

    res.status(201).json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/rides/available
// @desc    Get available rides for drivers
// @access  Private
router.get('/available', auth, async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'searching' }).populate('riderId', 'name phone');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/rides/my-ride
// @desc    Get current active ride for a user
// @access  Private
router.get('/my-ride', auth, async (req, res) => {
  try {
    const query = req.user.role === 'driver' 
      ? { driverId: req.user._id, status: { $in: ['accepted', 'started'] } }
      : { riderId: req.user._id, status: { $in: ['searching', 'accepted', 'started'] } };

    const ride = await Ride.findOne(query)
      .populate('driverId', 'name phone vehicleNumber vehicleType rating')
      .populate('riderId', 'name phone rating');
    
    res.json(ride || null);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/rides/accept
// @desc    Accept a ride
// @access  Private
router.post('/accept', auth, async (req, res) => {
  const { rideId } = req.body;
  const driverId = req.user._id;

  try {
    const driver = await User.findById(req.user.id);
    if (driver.role !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can accept rides' });
    }

    // Check subscription
    if (driver.subscriptionStatus !== 'active' || (driver.subscriptionExpiry && new Date() > driver.subscriptionExpiry)) {
      driver.subscriptionStatus = 'expired';
      await driver.save();
      return res.status(403).json({ message: 'Please renew your subscription to accept rides' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'searching') return res.status(400).json({ message: 'Ride already accepted' });

    ride.status = 'accepted';
    ride.driverId = driverId;
    await ride.save();

    // Notify rider that ride has been accepted
    const io = req.app.get('io');
    io.to(ride.riderId.toString()).emit('rideAccepted', ride);

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/rides/update-status
// @desc    Update ride status (start, complete, cancel)
// @access  Private
router.post('/update-status', auth, async (req, res) => {
  const { rideId, status, otp } = req.body;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    if (status === 'started') {
      if (ride.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
    }

    ride.status = status;
    
    if (status === 'cancelled') {
      ride.driverId = null;
    }
    
    await ride.save();

    // Notify other party about status update
    const io = req.app.get('io');
    const targetId = req.user.role === 'driver' ? ride.riderId : ride.driverId;
    if (targetId) {
      io.to(targetId.toString()).emit('rideStatusUpdate', ride);
    }

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/rides/history
// @desc    Get ride history for the logged in user
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const rides = await Ride.find({
      $or: [{ riderId: req.user._id }, { driverId: req.user._id }],
      status: { $in: ['completed', 'cancelled'] }
    })
    .populate('riderId', 'name phone')
    .populate('driverId', 'name phone vehicleNumber vehicleType')
    .sort({ createdAt: -1 });

    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
