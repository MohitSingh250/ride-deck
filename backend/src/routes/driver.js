const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/driver/subscription
// @desc    Activate driver subscription (Mock Payment)
// @access  Private
router.post('/subscription', auth, authorize('driver'), async (req, res) => {
  const { plan } = req.body; // plan: 'daily', 'weekly', 'monthly'
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Mock payment success
    const expiry = new Date();
    if (plan === 'daily') expiry.setDate(expiry.getDate() + 1);
    if (plan === 'weekly') expiry.setDate(expiry.getDate() + 7);
    if (plan === 'monthly') expiry.setDate(expiry.getDate() + 30);

    user.subscriptionStatus = 'active';
    user.subscriptionExpiry = expiry;
    await user.save();

    res.json({ success: true, subscriptionStatus: user.subscriptionStatus, expiry: user.subscriptionExpiry });
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
        if (user.subscriptionStatus !== 'active' || (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date())) {
            user.subscriptionStatus = 'expired';
            await user.save();
            return res.status(403).json({ message: 'Subscription expired. Please renew to go online.' });
        }
        // In a real app, this would be the actual driver location
        user.currentLocation = { lat: 28.6139, lng: 77.2090 }; 
    }
    user.isOnline = isOnline;
    await user.save();

    res.json({ success: true, isOnline: user.isOnline });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
