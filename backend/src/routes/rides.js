const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/authMiddleware');

// @route   POST /api/rides/book
// @desc    Book a new ride
// @access  Private
router.post('/book', auth, async (req, res) => {
    const { pickup, dropoff, vehicleType, fare, pickupCoords, dropoffCoords } = req.body;
    const riderId = req.user._id;

    try {
      // Check for existing active ride
      const existingRide = await Ride.findOne({ 
        riderId, 
        status: { $in: ['searching', 'accepted', 'started'] } 
      });

      if (existingRide) {
        return res.status(400).json({ message: 'You already have an active ride.' });
      }

      const user = await User.findById(riderId);
      if (user.walletBalance < fare) {
        return res.status(400).json({ message: 'Insufficient wallet balance. Please top up.' });
      }

      // Use provided coordinates or fallback to mock (New Delhi area)
      const pickupLat = pickupCoords?.lat || 28.6139 + (Math.random() - 0.5) * 0.05;
      const pickupLng = pickupCoords?.lng || 77.2090 + (Math.random() - 0.5) * 0.05;
      const dropoffLat = dropoffCoords?.lat || 28.6139 + (Math.random() - 0.5) * 0.05;
      const dropoffLng = dropoffCoords?.lng || 77.2090 + (Math.random() - 0.5) * 0.05;

    const ride = new Ride({
      riderId,
      pickup: { 
        address: pickup,
        lat: pickupLat,
        lng: pickupLng
      },
      dropoff: { 
        address: dropoff,
        lat: dropoffLat,
        lng: dropoffLng
      },
      vehicleType,
      fare,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
    });

    await ride.save();

    // Smart Matching: Find drivers within 5km radius
    let nearbyDrivers = await User.find({
      role: 'driver',
      isOnline: true,
      subscriptionStatus: 'active',
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [pickupLng, pickupLat]
          },
          $maxDistance: 5000 // 5km in meters
        }
      }
    }).limit(30); // Fetch more to allow for tier-based sorting

    // Priority Matching: Sort by subscription tier, then rating, then acceptance rate
    const tierPriority = { 'monthly': 3, 'weekly': 2, 'daily': 1, 'none': 0 };
    nearbyDrivers.sort((a, b) => {
      const tierA = tierPriority[a.subscriptionType] || 0;
      const tierB = tierPriority[b.subscriptionType] || 0;
      if (tierB !== tierA) return tierB - tierA;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.acceptanceRate - a.acceptanceRate;
    });

    nearbyDrivers = nearbyDrivers.slice(0, 15);

    // If ride is sponsored, prioritize drivers opted into that brand's campaign
    const Brand = require('../models/Brand');
    const brands = await Brand.find();
    let sponsoredBrandName = null;
    for (const brand of brands) {
      for (const loc of brand.locations) {
        if (Math.sqrt(Math.pow(loc.lat - pickupLat, 2) + Math.pow(loc.lng - pickupLng, 2)) < 0.005 ||
            Math.sqrt(Math.pow(loc.lat - dropoffLat, 2) + Math.pow(loc.lng - dropoffLng, 2)) < 0.005) {
          sponsoredBrandName = brand.name;
          break;
        }
      }
      if (sponsoredBrandName) break;
    }

    let targetDrivers = nearbyDrivers;
    if (sponsoredBrandName) {
      // Filter drivers who have opted into this brand's campaign
      const campaignDrivers = nearbyDrivers.filter(d => d.optedInCampaigns?.includes(sponsoredBrandName));
      if (campaignDrivers.length > 0) {
        targetDrivers = campaignDrivers;
      }
    }

    const io = req.app.get('io');
    if (targetDrivers.length > 0) {
      targetDrivers.forEach(driver => {
        io.to(driver._id.toString()).emit('newRideRequest', {
          ...ride.toObject(),
          sponsoredBy: sponsoredBrandName
        });
      });
    } else {
      io.emit('newRideRequest', ride);
    }

    res.status(201).json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/rides/available
// @desc    Get available rides for drivers (sorted by proximity)
// @access  Private
router.get('/available', auth, async (req, res) => {
  const { lat, lng } = req.query;
  
  try {
    let query = { status: 'searching' };
    let rides = await Ride.find(query).populate('riderId', 'name phone rating');

    if (lat && lng) {
      // Sort by proximity if coordinates provided
      rides = rides.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.pickup.lat - lat, 2) + Math.pow(a.pickup.lng - lng, 2));
        const distB = Math.sqrt(Math.pow(b.pickup.lat - lat, 2) + Math.pow(b.pickup.lng - lng, 2));
        return distA - distB;
      });
    }

    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/rides/my-ride
// @desc    Get current active ride for a user
// @access  Private
router.get('/my-ride', auth, async (req, res) => {
  try {
    const query = req.user.role === 'driver' 
      ? { driverId: req.user._id, status: { $in: ['accepted', 'started'] } }
      : { riderId: req.user._id, status: { $in: ['searching', 'accepted', 'started'] } };

    const ride = await Ride.findOne(query)
      .populate('driverId', 'name phone vehicleNumber vehicleType rating')
      .populate('riderId', 'name phone rating');
    
    res.json(ride || null);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/rides/accept
// @desc    Accept a ride
// @access  Private
router.post('/accept', auth, async (req, res) => {
  const { rideId } = req.body;
  const driverId = req.user._id;

  try {
    const driver = await User.findById(req.user.id);
    if (driver.role !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can accept rides' });
    }

    if (!driver.isOnline) {
      return res.status(403).json({ message: 'You must be online to accept rides' });
    }

    // Check subscription
    if (driver.subscriptionStatus !== 'active' || (driver.subscriptionExpiry && new Date() > driver.subscriptionExpiry)) {
      driver.subscriptionStatus = 'expired';
      await driver.save();
      return res.status(403).json({ message: 'Please renew your subscription to accept rides' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'searching') return res.status(400).json({ message: 'Ride already accepted' });

    ride.status = 'accepted';
    ride.driverId = driverId;
    await ride.save();

    // Notify rider that ride has been accepted
    const io = req.app.get('io');
    io.to(ride.riderId.toString()).emit('rideAccepted', ride);
    
    // Also notify drivers to remove this ride from their list
    io.emit('rideTaken', rideId);

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/rides/update-status
// @desc    Update ride status (start, complete, cancel)
// @access  Private
router.post('/update-status', auth, async (req, res) => {
  const { rideId, status, otp } = req.body;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    if (status === 'started') {
      if (ride.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
    }

    ride.status = status;
    
    if (status === 'arrived') {
      // Optional: Add specific logic for arrival
    }
    
    if (status === 'started') {
      if (req.body.otp !== ride.otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
      ride.status = 'started';
      
      // Mock Safety Monitoring: Start an interval to check for anomalies
      // In a real app, this would be a background job or a separate service
      console.log(`Safety monitoring started for ride ${ride._id}`);
    }

    if (status === 'completed') {
      // Calculate Fare Split
      // Platform: 20%, Driver: 80% (minus brand subsidy if any)
      const platformCommission = ride.fare * 0.2;
      const brandSubsidy = req.body.sponsoredBy ? 20 : 0; // Mock subsidy
      const driverEarnings = ride.fare - platformCommission + brandSubsidy;

      ride.fareSplit = {
        driver: Math.round(driverEarnings),
        platform: Math.round(platformCommission),
        brand: Math.round(brandSubsidy)
      };
      ride.status = 'completed';
      try {
        const session = await User.startSession();
        await session.withTransaction(async () => {
          const rider = await User.findById(ride.riderId).session(session);
          const driver = await User.findById(ride.driverId).session(session);

          if (!rider || !driver) {
            throw new Error('Rider or Driver not found');
          }

          if (rider.walletBalance < ride.fare) {
            throw new Error('Rider has insufficient balance');
          }

          // Deduct from rider
          rider.walletBalance -= ride.fare;
          
          // Add loyalty points (10% of fare)
          const earnedPoints = Math.floor(ride.fare * 0.1);
          rider.loyaltyPoints = (rider.loyaltyPoints || 0) + earnedPoints;
          
          await rider.save({ session });

          // Add to driver
          driver.walletBalance += ride.fare;
          await driver.save({ session });

          // Create transactions
          await Transaction.create([
            {
              userId: rider._id,
              amount: ride.fare,
              type: 'debit',
              category: 'ride_fare',
              description: `Ride to ${ride.dropoff.address}`,
              rideId: ride._id
            },
            {
              userId: driver._id,
              amount: ride.fare,
              type: 'credit',
              category: 'ride_fare',
              description: `Ride from ${ride.pickup.address}`,
              rideId: ride._id
            }
          ], { session });
        });
        session.endSession();
      } catch (transactionError) {
        console.error('Transaction failed, falling back to non-transactional update:', transactionError);
        
        // Fallback for environments without Replica Set support
        const rider = await User.findById(ride.riderId);
        const driver = await User.findById(ride.driverId);

        if (!rider || !driver) {
          return res.status(404).json({ message: 'Rider or Driver not found' });
        }

        if (rider.walletBalance < ride.fare) {
          return res.status(400).json({ message: 'Rider has insufficient balance' });
        }

        // Deduct from rider
        rider.walletBalance -= ride.fare;
        const earnedPoints = Math.floor(ride.fare * 0.1);
        rider.loyaltyPoints = (rider.loyaltyPoints || 0) + earnedPoints;
        await rider.save();

        // Add to driver
        driver.walletBalance += ride.fare;
        await driver.save();

        // Create transactions
        await Transaction.create([
          {
            userId: rider._id,
            amount: ride.fare,
            type: 'debit',
            category: 'ride_fare',
            description: `Ride to ${ride.dropoff.address}`,
            rideId: ride._id
          },
          {
            userId: driver._id,
            amount: ride.fare,
            type: 'credit',
            category: 'ride_fare',
            description: `Ride from ${ride.pickup.address}`,
            rideId: ride._id
          }
        ]);
      }
    }

    await ride.save();

    // Notify both parties of the status update
    const io = req.app.get('io');
    if (ride.riderId) io.to(ride.riderId.toString()).emit('rideStatusUpdate', ride);
    if (ride.driverId) io.to(ride.driverId.toString()).emit('rideStatusUpdate', ride);
    
    // If cancelled, we might need to notify the driver even if ride.driverId was just set to null
    if (status === 'cancelled' && req.body.originalDriverId) {
       io.to(req.body.originalDriverId).emit('rideStatusUpdate', ride);
    }

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/rides/history
// @desc    Get ride history for the logged in user
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const rides = await Ride.find({
      $or: [{ riderId: req.user._id }, { driverId: req.user._id }],
      status: { $in: ['completed', 'cancelled'] }
    })
    .populate('riderId', 'name phone')
    .populate('driverId', 'name phone vehicleNumber vehicleType')
    .sort({ createdAt: -1 });

    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/rides/estimate-fare
// @desc    Estimate fare based on distance and time
// @access  Private
router.post('/estimate-fare', auth, async (req, res) => {
  const { distance, duration, vehicleType } = req.body;
  
  try {
    const distanceKm = distance / 1000;
    const durationMin = duration / 60;

    // Uber-like Fare Formula: Base + (Distance * Rate) + (Time * Rate)
    const rates = {
      bike: { base: 20, perKm: 8, perMin: 1, minFare: 30 },
      auto: { base: 30, perKm: 12, perMin: 1.5, minFare: 50 },
      cab: { base: 50, perKm: 18, perMin: 2, minFare: 80 }
    };

    const rate = rates[vehicleType] || rates.bike;
    let fare = rate.base + (distanceKm * rate.perKm) + (durationMin * rate.perMin);
    
    // Apply minimum fare
    fare = Math.max(fare, rate.minFare);

    // Intelligent Pricing Factors (Mocked for demonstration)
    const hour = new Date().getHours();
    let surgeMultiplier = 1.0;
    
    // 1. Time-based Surge (Peak Hours)
    if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 22)) {
      surgeMultiplier += 0.2;
    }

    // 2. Traffic Density (Mocked based on random factor)
    const trafficFactor = 1 + (Math.random() * 0.3); // 1.0x to 1.3x
    surgeMultiplier *= trafficFactor;

    // 3. Weather Factor (Mocked)
    const weatherConditions = ['clear', 'rainy', 'stormy'];
    const currentWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    if (currentWeather === 'rainy') surgeMultiplier += 0.1;
    if (currentWeather === 'stormy') surgeMultiplier += 0.2;

    // 4. Demand Factor (Mocked)
    const demandFactor = 1 + (Math.random() * 0.2); // 1.0x to 1.2x
    surgeMultiplier *= demandFactor;

    // Brand Collaboration: Sponsored Rides
    const Brand = require('../models/Brand');
    const brands = await Brand.find();
    let discount = 0;
    let sponsoredBy = null;

    if (req.body.pickupCoords || req.body.dropoffCoords) {
      const pLat = req.body.pickupCoords?.lat;
      const pLng = req.body.pickupCoords?.lng;
      const dLat = req.body.dropoffCoords?.lat;
      const dLng = req.body.dropoffCoords?.lng;

      for (const brand of brands) {
        for (const loc of brand.locations) {
          const distToPickup = pLat ? Math.sqrt(Math.pow(loc.lat - pLat, 2) + Math.pow(loc.lng - pLng, 2)) : 1;
          const distToDropoff = dLat ? Math.sqrt(Math.pow(loc.lat - dLat, 2) + Math.pow(loc.lng - dLng, 2)) : 1;
          
          if (distToPickup < 0.005 || distToDropoff < 0.005) {
            discount = 20;
            sponsoredBy = brand.name;
            break;
          }
        }
        if (discount > 0) break;
      }
    }

    let finalFare = (fare * surgeMultiplier) - discount;
    finalFare = Math.max(finalFare, rate.minFare);

    res.json({ 
      fare: Math.round(finalFare),
      breakup: {
        base: rate.base,
        distanceFare: Math.round(distanceKm * rate.perKm),
        timeFare: Math.round(durationMin * rate.perMin),
        surge: `${surgeMultiplier.toFixed(1)}x`,
        factors: {
          traffic: `${((trafficFactor - 1) * 100).toFixed(0)}% extra`,
          weather: currentWeather,
          demand: `${((demandFactor - 1) * 100).toFixed(0)}% high`
        },
        discount: discount,
        sponsoredBy: sponsoredBy
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
