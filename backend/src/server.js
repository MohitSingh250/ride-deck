const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB(process.env.MONGO_URI);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/driver', require('./routes/driver'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => {
  res.send('Ride Deck API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
