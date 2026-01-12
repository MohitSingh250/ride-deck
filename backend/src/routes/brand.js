const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');

// Get all active brands
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seed some initial brands for demonstration
router.post('/seed', async (req, res) => {
  try {
    const brands = [
      {
        name: 'Dominos',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Domino%27s_pizza_logo.svg/1200px-Domino%27s_pizza_logo.svg.png',
        locations: [
          { address: 'Connaught Place, Delhi', lat: 28.6328, lng: 77.2197 },
          { address: 'Indiranagar, Bangalore', lat: 12.9716, lng: 77.6412 }
        ],
        offerText: 'Get 20% off on your next order!',
        category: 'food'
      },
      {
        name: 'Starbucks',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png',
        locations: [
          { address: 'Cyber Hub, Gurgaon', lat: 28.4951, lng: 77.0894 },
          { address: 'Bandra, Mumbai', lat: 19.0596, lng: 72.8295 }
        ],
        offerText: 'Buy 1 Get 1 Free on all beverages!',
        category: 'food'
      }
    ];
    await Brand.deleteMany({});
    await Brand.insertMany(brands);
    res.json({ message: 'Brands seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
