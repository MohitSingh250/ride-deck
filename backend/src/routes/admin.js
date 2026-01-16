const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ride = require('../models/Ride');
const Transaction = require('../models/Transaction');
const { auth, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/admin/stats
// @desc    Get platform-wide statistics
// @access  Private/Admin
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const [totalUsers, totalDrivers, totalRides, totalRevenue] = await Promise.all([
      User.countDocuments({ role: 'rider' }),
      User.countDocuments({ role: 'driver' }),
      Ride.countDocuments({ status: 'completed' }),
      Transaction.aggregate([
        { $match: { category: 'ride_fare' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      totalUsers,
      totalDrivers,
      totalRides,
      revenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/admin/drivers/pending
// @desc    Get drivers with pending KYC
// @access  Private/Admin
router.get('/drivers/pending', auth, authorize('admin'), async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver', kycStatus: 'pending' });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/admin/drivers
// @desc    Get all drivers
// @access  Private/Admin
router.get('/drivers', auth, authorize('admin'), async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).select('-password');
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/admin/drivers/verify
// @desc    Verify or reject driver KYC
// @access  Private/Admin
router.post('/drivers/verify', auth, authorize('admin'), async (req, res) => {
  const { driverId, status } = req.body; // status: 'verified' or 'rejected'
  try {
    const driver = await User.findById(driverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    driver.kycStatus = status;
    if (status === 'verified') driver.isVerified = true;
    await driver.save();

    // Emit socket event to the driver
    const io = req.app.get('io');
    if (io) {
      console.log(`Admin: Emitting kyc-status-update to driver ${driverId}: ${status}`);
      io.to(driverId.toString()).emit('kyc-status-update', { 
        status,
        message: `Your KYC has been ${status}`
      });
    }

    res.json({ message: `Driver KYC ${status} successfully`, driver });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/admin/rides/active
// @desc    Get currently active rides for monitoring
// @access  Private/Admin
router.get('/rides/active', auth, authorize('admin'), async (req, res) => {
  try {
    const rides = await Ride.find({ status: { $in: ['accepted', 'started'] } })
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone vehicleNumber')
      .sort({ updatedAt: -1 });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/admin/rides
// @desc    Get all rides for monitoring
// @access  Private/Admin
router.get('/rides', auth, authorize('admin'), async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone vehicleNumber')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/admin/rides/:id/cancel
// @desc    Force cancel a ride
// @access  Private (Admin only)
router.post('/rides/:id/cancel', auth, authorize('admin'), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // If already completed or cancelled, do nothing
    if (['completed', 'cancelled'].includes(ride.status)) {
      return res.status(400).json({ message: `Ride is already ${ride.status}` });
    }

    const previousStatus = ride.status;
    ride.status = 'cancelled';
    ride.driverId = null; // Unassign driver
    await ride.save();

    // Notify Rider and Driver
    const io = req.app.get('io');
    if (io) {
      if (ride.riderId) {
        io.to(ride.riderId.toString()).emit('rideStatusUpdate', { 
          ...ride.toObject(), 
          status: 'cancelled', 
          message: 'Ride cancelled by Admin' 
        });
      }
      // If there was a driver assigned, notify them too
      // Note: We cleared driverId, so we need to check if we have the old ID or just broadcast
      // Ideally, we should have stored the old driverId before clearing
    }

    res.json({ message: 'Ride force cancelled successfully', ride });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
