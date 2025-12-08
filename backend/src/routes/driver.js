const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   POST /api/driver/subscription
// @desc    Activate driver subscription (Mock Payment)
// @access  Private (TODO: Add middleware)
router.post('/subscription', async (req, res) => {
  const { userId, plan } = req.body; // plan: 'daily', 'weekly', 'monthly'

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
router.post('/status', async (req, res) => {
  const { userId, isOnline } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isOnline = isOnline;
    if (isOnline) {
        user.currentLocation = { lat: 28.9931, lng: 77.0151 }; // Mock location (Sonipat)
    }
    await user.save();

    res.json({ success: true, isOnline: user.isOnline });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
