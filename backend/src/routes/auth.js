const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Register a new user (rider or driver)
// @access  Public
router.post('/register', async (req, res) => {
  const { name, phone, role, vehicleType, vehicleNumber } = req.body;

  try {
    let user = await User.findOne({ phone });

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      name,
      phone,
      role,
      vehicleType,
      vehicleNumber,
    });

    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      token: 'mock-jwt-token', // For MVP
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  const { phone } = req.body;

  try {
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      token: 'mock-jwt-token', // For MVP
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
