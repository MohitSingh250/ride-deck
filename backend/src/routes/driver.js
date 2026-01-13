const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/driver/subscribe
// @desc    Purchase/Activate driver subscription (Mock Payment)
// @access  Private
router.post('/subscribe', auth, authorize('driver'), async (req, res) => {
  const { type } = req.body; // type: 'daily', 'weekly', 'monthly'
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let durationDays = 0;
    if (type === 'daily') durationDays = 1;
    else if (type === 'weekly') durationDays = 7;
    else if (type === 'monthly') durationDays = 30;
    else return res.status(400).json({ message: 'Invalid subscription type' });

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + durationDays);

    user.subscriptionStatus = 'active';
    user.subscriptionType = type;
    user.subscriptionExpiry = expiry;
    await user.save();

    res.json({ 
      success: true, 
      message: `Subscribed to ${type} plan successfully`,
      subscriptionStatus: user.subscriptionStatus, 
      expiry: user.subscriptionExpiry 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/driver/status
// @desc    Toggle driver online/offline status
// @access  Private
router.post('/status', auth, authorize('driver'), async (req, res) => {
  const { isOnline } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (isOnline) {
        if (user.kycStatus !== 'verified') {
            return res.status(403).json({ message: 'KYC not verified. Please complete your KYC to go online.' });
        }
        if (user.subscriptionStatus !== 'active' || (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date())) {
            user.subscriptionStatus = 'expired';
            await user.save();
            return res.status(403).json({ message: 'Subscription expired. Please renew to go online.' });
        }
        
        const { lat, lng } = req.body;
        if (lat && lng) {
          user.currentLocation = {
            type: 'Point',
            coordinates: [lng, lat]
          };
        }
    }
    user.isOnline = isOnline;
    await user.save();

    res.json({ success: true, isOnline: user.isOnline });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Get driver stats
router.get('/stats', auth, async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const Ride = require('../models/Ride');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayTransactions, totalRides, user] = await Promise.all([
      Transaction.find({ 
        userId: req.user._id, 
        category: 'ride_fare',
        createdAt: { $gte: today }
      }),
      Ride.countDocuments({ driverId: req.user._id, status: 'completed' }),
      User.findById(req.user._id).select('walletBalance')
    ]);

    const todayEarnings = todayTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      todayEarnings,
      totalRides,
      walletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Get earnings history (last 7 days)
router.get('/earnings-history', auth, async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const history = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTransactions = await Transaction.find({
        userId: req.user._id,
        category: 'ride_fare',
        createdAt: { $gte: date, $lt: nextDate }
      });

      const amount = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      history.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        amount
      });
    }

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Submit KYC documents
router.post('/kyc', auth, authorize('driver'), async (req, res) => {
  const { kycDocuments } = req.body;
  try {
    const user = await User.findById(req.user._id);
    user.kycDocuments = kycDocuments;
    user.kycStatus = 'pending';
    await user.save();
    res.json({ message: 'KYC documents submitted successfully', kycStatus: user.kycStatus });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
