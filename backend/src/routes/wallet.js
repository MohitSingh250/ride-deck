const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { auth } = require('../middleware/authMiddleware');


router.get('/history', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    const user = await User.findById(req.user._id).select('walletBalance');
    
    res.json({
      balance: user.walletBalance,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


router.post('/topup', auth, async (req, res) => {
  const { amount } = req.body;
  try {
    const user = await User.findById(req.user._id);
    user.walletBalance += Number(amount);
    await user.save();

    await Transaction.create({
      userId: user._id,
      amount: Number(amount),
      type: 'credit',
      category: 'topup',
      description: 'Wallet Top-up'
    });

    res.json({ balance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Withdraw from wallet (Mock)
router.post('/withdraw', auth, async (req, res) => {
  const { amount } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (user.walletBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    user.walletBalance -= Number(amount);
    await user.save();

    await Transaction.create({
      userId: user._id,
      amount: Number(amount),
      type: 'debit',
      category: 'withdrawal',
      description: 'Wallet Withdrawal'
    });

    res.json({ balance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Update bank account details
router.post('/bank-account', auth, async (req, res) => {
  const { accountNumber, ifscCode, bankName, holderName } = req.body;
  try {
    const user = await User.findById(req.user._id);
    user.bankAccount = { accountNumber, ifscCode, bankName, holderName };
    await user.save();
    res.json({ message: 'Bank account updated successfully', bankAccount: user.bankAccount });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
