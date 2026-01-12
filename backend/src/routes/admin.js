const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ride = require('../models/Ride');
const { auth } = require('../middleware/authMiddleware');

// @route   GET /api/admin/stats
// @desc    Get platform statistics
// @access  Private (Admin only - for now just auth)
router.get('/stats', auth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRides = await Ride.countDocuments();
    const activeDrivers = await User.countDocuments({ role: 'driver', isOnline: true });
    
    // Calculate total revenue
    const rides = await Ride.find({ status: 'completed' });
    const totalRevenue = rides.reduce((acc, ride) => acc + (ride.fare || 0), 0);

    const recentRides = await Ride.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('riderId', 'name')
      .populate('driverId', 'name');

    res.json({
      stats: {
        totalUsers,
        totalRides,
        totalRevenue,
        activeDrivers
      },
      recentRides
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
