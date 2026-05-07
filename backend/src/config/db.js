const mongoose = require('mongoose')

async function connectDB(uri) {
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
