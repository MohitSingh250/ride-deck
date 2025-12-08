const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   PUT /api/users/update/:id
// @desc    Update user profile
// @access  Public (should be protected)
router.put('/update/:id', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { name, email, phone } },
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password from result

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
