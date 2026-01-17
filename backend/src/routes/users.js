const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/authMiddleware');

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/users/update/:id
// @desc    Update user profile (Admin/Self)
// @access  Private
router.put('/update/:id', auth, async (req, res) => {
  try {
    // Ensure user is updating their own profile
    if (req.params.id !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { name, email, phone } = req.body;
    
    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { name, email, phone } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/users/saved-places
// @desc    Add a saved place
// @access  Private
router.post('/saved-places', auth, async (req, res) => {
  const { name, address, lat, lng, icon } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.savedPlaces.push({ name, address, lat, lng, icon });
    await user.save();

    res.json(user.savedPlaces);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   DELETE /api/users/saved-places/:id
// @desc    Remove a saved place
// @access  Private
router.delete('/saved-places/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.savedPlaces = user.savedPlaces.filter(place => place._id.toString() !== req.params.id);
    await user.save();

    res.json(user.savedPlaces);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
