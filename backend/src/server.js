const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Permissive CORS for debugging
const corsOptions = {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket']
});

// Middleware
app.use(morgan('dev'));
app.use(express.json());

// Database Connection
connectDB(process.env.MONGO_URI);

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`User ${userId} joined their room: ${userId}`);
    }
  });

  socket.on('driver-online', (driverId) => {
    socket.join('drivers');
    console.log(`Driver ${driverId} joined drivers room`);
  });

  socket.on('join-admin', () => {
    socket.join('admins');
    console.log(`Admin ${socket.id} joined admins room`);
  });

  socket.on('update-location', ({ rideId, location, driverId }) => {
    // Broadcast to the specific rider and all admins
    io.to(rideId).emit('location-update', { location, driverId });
    io.to('admins').emit('admin-location-update', { rideId, location, driverId });
  });

  // Chat Logic
  socket.on('send-message', ({ to, message, senderName }) => {
    if (to) {
      io.to(to.toString()).emit('receive-message', {
        from: socket.id,
        message,
        senderName,
        timestamp: new Date()
      });
      console.log(`Message from ${senderName} to ${to}: ${message}`);
    }
  });

  // SOS Logic
  socket.on('sos-alert', ({ userId, userName, location, rideId }) => {
    console.error(`🚨 SOS ALERT from ${userName} (ID: ${userId}) on ride ${rideId} at ${JSON.stringify(location)}`);
    // In a real app, this would notify emergency services and admins
    io.emit('admin-sos-alert', { userId, userName, location, rideId, timestamp: new Date() });
  });

  // Share Trip Logic
  socket.on('share-trip', ({ rideId, riderName, location, destination }) => {
    console.log(`Trip shared by ${riderName} for ride ${rideId}`);
    // This could generate a unique link or notify specific contacts
    // For now, we'll just acknowledge it
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/driver');
const rideRoutes = require('./routes/rides');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const growthRoutes = require('./routes/growth');
const brandRoutes = require('./routes/brand');
const walletRoutes = require('./routes/wallet');

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/brands', brandRoutes);

app.get('/', (req, res) => {
  res.send('Ride Deck API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
