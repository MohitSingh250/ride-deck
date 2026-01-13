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

module.exports = router;
