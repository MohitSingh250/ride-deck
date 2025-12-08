const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const User = require('../models/User');

// @route   POST /api/rides/book
// @desc    Book a new ride
// @access  Private
router.post('/book', async (req, res) => {
  const { riderId, pickup, dropoff, vehicleType, fare } = req.body;

  try {
    // Check for existing active ride
    const existingRide = await Ride.findOne({ 
      riderId, 
      status: { $in: ['searching', 'accepted', 'started'] } 
    });

    if (existingRide) {
      return res.status(400).json({ message: 'You already have an active ride.' });
    }

    const ride = new Ride({
      riderId,
      pickup: { address: pickup },
      dropoff: { address: dropoff },
      vehicleType,
      fare: fare || 50, // Mock fare if not calculated
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
    });

    await ride.save();
    res.status(201).json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/rides/available
// @desc    Get available rides for drivers
// @access  Private
router.get('/available', async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'searching' }).populate('riderId', 'name phone');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/rides/my-ride/:userId
// @desc    Get current active ride for a rider
// @access  Private
router.get('/my-ride/:userId', async (req, res) => {
  try {
    const ride = await Ride.findOne({ 
      riderId: req.params.userId, 
      status: { $in: ['searching', 'accepted', 'started'] } 
    }).populate('driverId', 'name phone vehicleNumber vehicleType');
    
    res.json(ride || null);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/rides/accept
// @desc    Accept a ride
// @access  Private
router.post('/accept', async (req, res) => {
  const { rideId, driverId } = req.body;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'searching') return res.status(400).json({ message: 'Ride already accepted' });

    ride.status = 'accepted';
    ride.driverId = driverId;
    await ride.save();

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/rides/update-status
// @desc    Update ride status (start, complete)
// @access  Private
router.post('/update-status', async (req, res) => {
  const { rideId, status, otp } = req.body; // status: 'started', 'completed'

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    if (status === 'started') {
        if (ride.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
    }

    ride.status = status;
    if (status === 'completed') {
        // Here we would handle payment logic if integrated
    }
    if (status === 'cancelled') {
        ride.driverId = null; 
        
        console.log(`Cancelling ride ${ride._id} for user ${ride.riderId}`);

        // CLEANUP: Cancel ALL other active rides for this user
        const result = await Ride.updateMany(
            { 
                riderId: ride.riderId, 
                _id: { $ne: ride._id }, 
                status: { $in: ['searching', 'accepted', 'started'] } 
            },
            { status: 'cancelled', driverId: null }
        );
        console.log(`Cleanup: Cancelled ${result.modifiedCount} other active rides.`);
    }
    
    await ride.save();
    console.log(`Ride ${ride._id} status updated to ${status}`);
    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/rides/history/:userId
// @desc    Get ride history for a user (rider or driver)
// @access  Public (should be protected in prod)
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // Find rides where user is either rider or driver, and status is completed or cancelled
    const rides = await Ride.find({
      $or: [{ riderId: userId }, { driverId: userId }],
      status: { $in: ['completed', 'cancelled'] }
    })
    .populate('riderId', 'name phone')
    .populate('driverId', 'name phone vehicleNumber vehicleType')
    .sort({ createdAt: -1 }); // Newest first

    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
