const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    required: true,
  },
  locations: [{
    address: String,
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    }
  }],
  offerText: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['food', 'shopping', 'entertainment', 'other'],
    default: 'other',
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);
