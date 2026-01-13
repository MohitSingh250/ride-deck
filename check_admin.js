const mongoose = require('mongoose');
const User = require('./backend/src/models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ridedeck');
    console.log('Connected to MongoDB');

    const admins = await User.find({ role: 'admin' });
    console.log('Admins found:', admins.length);
    admins.forEach(admin => {
      console.log(`- ${admin.name} (${admin.phone})`);
    });

    if (admins.length === 0) {
      console.log('No admins found. Promoting the first user to admin for testing...');
      const firstUser = await User.findOne();
      if (firstUser) {
        firstUser.role = 'admin';
        await firstUser.save();
        console.log(`Promoted ${firstUser.name} (${firstUser.phone}) to admin.`);
      } else {
        console.log('No users found in database.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkAdmin();
