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

    const user = await User.findById(riderId);
    if (user.walletBalance < fare) {
      return res.status(400).json({ message: 'Insufficient wallet balance. Please top up.' });
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
      fare,
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

    if (!driver.isOnline) {
      return res.status(403).json({ message: 'You must be online to accept rides' });
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
    
    // Also notify drivers to remove this ride from their list
    io.emit('rideTaken', rideId);

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
    
    if (status === 'completed') {
      const session = await User.startSession();
      session.startTransaction();
      try {
        const rider = await User.findById(ride.riderId).session(session);
        const driver = await User.findById(ride.driverId).session(session);

        if (!rider || !driver) {
          throw new Error('Rider or Driver not found');
        }

        if (rider.walletBalance < ride.fare) {
          throw new Error('Rider has insufficient balance');
        }

        // Deduct from rider
        rider.walletBalance -= ride.fare;
        
        // Add loyalty points (10% of fare)
        const earnedPoints = Math.floor(ride.fare * 0.1);
        rider.loyaltyPoints = (rider.loyaltyPoints || 0) + earnedPoints;
        
        await rider.save({ session });

        // Add to driver
        driver.walletBalance += ride.fare;
        await driver.save({ session });

        // Create transactions
        const Transaction = require('../models/Transaction');
        
        await Transaction.create([
          {
            userId: rider._id,
            amount: ride.fare,
            type: 'debit',
            category: 'ride_fare',
            description: `Ride to ${ride.dropoff.address}`,
            rideId: ride._id
          },
          {
            userId: driver._id,
            amount: ride.fare,
            type: 'credit',
            category: 'ride_fare',
            description: `Ride from ${ride.pickup.address}`,
            rideId: ride._id
          }
        ], { session });

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
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
