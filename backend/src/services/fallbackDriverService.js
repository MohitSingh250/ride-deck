/**
 * Fallback Driver Service
 * Provides a high-fidelity "invisible" backup system that simulates real drivers
 * when no human drivers are available in the area.
 */
const Ride = require('../models/Ride');

const FALLBACK_PERSONAS = [
  {
    id: 'fallback_1',
    name: 'Vikram Singh',
    phone: '+91 98765 43210',
    vehicleNumber: 'DL 1C AB 1234',
    vehicleType: 'cab',
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
  },
  {
    id: 'fallback_2',
    name: 'Rahul Sharma',
    phone: '+91 91234 56789',
    vehicleNumber: 'DL 8C XY 5678',
    vehicleType: 'premier',
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
  },
  {
    id: 'fallback_3',
    name: 'Suresh Kumar',
    phone: '+91 99887 76655',
    vehicleNumber: 'DL 4C MH 9999',
    vehicleType: 'xl',
    rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
  },
  {
    id: 'fallback_ravi',
    name: 'Ravi',
    phone: '+91 98989 89898',
    vehicleNumber: 'DL 2C RT 1111',
    vehicleType: 'go',
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop'
  }
];

/**
 * Triggers the fallback simulation for a specific ride
 */
const triggerFallback = (io, riderId, rideId, rideData) => {
  console.log(`🤖 [Fallback] Initializing simulation for Ride: ${rideId}`);
  
  // 1. Initial delay to simulate "Searching..."
  setTimeout(() => {
    // Pick Ravi specifically for the user's test
    const persona = FALLBACK_PERSONAS.find(p => p.name === 'Ravi') || FALLBACK_PERSONAS[0];
    
    // 2. Emit the "Fake" offer to the marketplace
    const offer = {
      driverId: persona.id,
      amount: Math.round(rideData.fare * 1.1), // Slightly higher to encourage negotiation
      eta: Math.floor(Math.random() * 5) + 3,
      driverName: persona.name,
      rating: persona.rating,
      vehicleType: persona.vehicleType,
      vehicleNumber: persona.vehicleNumber,
      avatar: persona.avatar,
      createdAt: new Date()
    };

    io.to(riderId).emit('newOffer', { rideId, offer });
    console.log(`🤖 [Fallback] Sent offer from ${persona.name} for ₹${offer.amount}`);

    // Update ride in DB to include this offer for persistence
    Ride.findByIdAndUpdate(rideId, {
      $push: { offers: offer },
      status: 'negotiating'
    }).exec();

  }, 5000); // 5 second delay makes it fast for testing
};

/**
 * Handles the logic when a rider accepts a fallback persona
 */
const handleRiderAcceptFallback = async (io, riderId, rideId, persona, agreedFare, routeData) => {
  console.log(`🤖 [Fallback] Rider accepted ${persona.name}. Starting simulation.`);

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
  const ride = await Ride.findByIdAndUpdate(rideId, {
    status: 'booked',
    fare: agreedFare,
    fallbackDriver: {
      ...persona,
      isFallback: true
    },
    otp
  }, { new: true });

  // Notify UI
  io.to(riderId).emit('rideAccepted', ride);

  // Start Location Interpolation Simulation
  simulateMovement(io, riderId, rideId, routeData.pickup.coordinates, 'arriving');
};

/**
 * Simulates a driver moving on the map
 */
const simulateMovement = (io, riderId, rideId, targetCoords, phase) => {
  let step = 0;
  const totalSteps = 20;
  
  // Starting point (slightly offset from pickup)
  const startLat = targetCoords[1] + (Math.random() - 0.5) * 0.02;
  const startLng = targetCoords[0] + (Math.random() - 0.5) * 0.02;

  const interval = setInterval(() => {
    step++;
    const progress = step / totalSteps;
    
    const currentLat = startLat + (targetCoords[1] - startLat) * progress;
    const currentLng = startLng + (targetCoords[0] - startLng) * progress;

    io.to(riderId).emit('location-update', {
      rideId,
      location: { lat: currentLat, lng: currentLng },
      phase
    });

    if (step >= totalSteps) {
      clearInterval(interval);
      if (phase === 'arriving') {
        io.to(riderId).emit('driver-arrived', { rideId });
        console.log(`🤖 [Fallback] Driver arrived at pickup.`);
      }
    }
  }, 3000); // Update location every 3 seconds
};

module.exports = {
  triggerFallback,
  handleRiderAcceptFallback,
  FALLBACK_PERSONAS
};
