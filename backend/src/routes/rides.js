const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Campaign = require('../models/Campaign');
const { auth } = require('../middleware/authMiddleware');

// @route   POST /api/rides/book
// @desc    Book a new ride
// @access  Private
router.post('/book', auth, async (req, res) => {
    const { pickup, dropoff, vehicleType, fare, pickupCoords, dropoffCoords, paymentMethod } = req.body;
    const riderId = req.user._id;

    try {

      // Input Validation
      if (!pickup || !dropoff || !pickupCoords || !dropoffCoords || !fare) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      if (!pickupCoords.lat || !pickupCoords.lng || !dropoffCoords.lat || !dropoffCoords.lng) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }

      // Check for existing active ride
      const existingRide = await Ride.findOne({ 
        riderId, 
        status: { $in: ['searching', 'booked', 'arrived', 'started'] } 
      });

      if (existingRide) {
        return res.status(400).json({ message: 'You already have an active ride.' });
      }

      const user = await User.findById(riderId);
      
      // Only check balance if paying via wallet
      if (paymentMethod === 'wallet' && user.walletBalance < fare) {
        return res.status(400).json({ message: 'Insufficient wallet balance. Please top up or select Cash.' });
      }

      // Use provided coordinates or fallback to mock (New Delhi area)
      const pickupLat = pickupCoords?.lat || 28.6139 + (Math.random() - 0.5) * 0.05;
      const pickupLng = pickupCoords?.lng || 77.2090 + (Math.random() - 0.5) * 0.05;
      const dropoffLat = dropoffCoords?.lat || 28.6139 + (Math.random() - 0.5) * 0.05;
      const dropoffLng = dropoffCoords?.lng || 77.2090 + (Math.random() - 0.5) * 0.05;

    const ride = new Ride({
      riderId,
      pickup: { 
        type: 'Point',
        coordinates: [pickupLng, pickupLat],
        address: pickup
      },
      dropoff: { 
        type: 'Point',
        coordinates: [dropoffLng, dropoffLat],
        address: dropoff
      },
      vehicleType,
      fare,
      paymentMethod: paymentMethod || 'cash',
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
    });

    await ride.save();

    // Smart Matching: Find drivers within 5km radius
    // Map requested tier to driver vehicle type
    let driverVehicleType = 'cab';
    if (vehicleType === 'bike') driverVehicleType = 'bike';
    if (vehicleType === 'auto') driverVehicleType = 'auto';

    const query = {
      role: 'driver',
      isOnline: true,
      // subscriptionStatus: 'active',
      // kycStatus: 'verified', // Enforce KYC
      // rating: { $gte: 4.0 }, // Enforce minimum rating
      vehicleType: driverVehicleType,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [pickupLng, pickupLat]
          },
          $maxDistance: 5000 // 5km
        }
      }
    };

    // Stricter requirements for Premier
    if (vehicleType === 'premier') {
      query.rating = { $gte: 4.7 };
    }

    let nearbyDrivers = await User.find(query).limit(30);

    // Priority Matching: Sort by Distance (implicit in $near) then Rating
    // $near already sorts by distance. We can re-sort if we want to prioritize Rating over small distance differences.
    // Hybrid Score = (Distance * Weight) - (Rating * Weight)
    // For now, let's stick to $near (Distance) as primary, but boost high-rated drivers if they are close.
    
    nearbyDrivers.sort((a, b) => {
      // Calculate distance to pickup
      const distA = Math.sqrt(Math.pow(a.currentLocation.coordinates[1] - pickupLat, 2) + Math.pow(a.currentLocation.coordinates[0] - pickupLng, 2));
      const distB = Math.sqrt(Math.pow(b.currentLocation.coordinates[1] - pickupLat, 2) + Math.pow(b.currentLocation.coordinates[0] - pickupLng, 2));
      
      // If distance difference is small (< 500m), prioritize higher rating
      if (Math.abs(distA - distB) < 0.005) {
        return b.rating - a.rating;
      }
      return distA - distB; // Otherwise closest driver wins
    });

    nearbyDrivers = nearbyDrivers.slice(0, 15);

    // If ride is sponsored, prioritize drivers opted into that brand's campaign
    // If ride is sponsored, prioritize drivers opted into that brand's campaign
    // const Campaign = require('../models/Campaign'); // Removed duplicate
    let sponsoredBrandName = null;

    // Check for active campaigns near pickup
    const sponsoredCampaign = await Campaign.findOne({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [pickupLng, pickupLat]
          },
          $maxDistance: 500 // 500m radius
        }
      }
    }).populate('brandId');

    if (sponsoredCampaign && sponsoredCampaign.brandId) {
      sponsoredBrandName = sponsoredCampaign.brandId.name;
    }

    let targetDrivers = nearbyDrivers;
    if (sponsoredBrandName) {
      // Filter drivers who have opted into this brand's campaign
      const campaignDrivers = nearbyDrivers.filter(d => d.optedInCampaigns?.includes(sponsoredBrandName));
      if (campaignDrivers.length > 0) {
        targetDrivers = campaignDrivers;
      }
    }

    const populatedRide = await Ride.findById(ride._id).populate('riderId', 'name phone rating');

    const io = req.app.get('io');
    if (targetDrivers.length > 0) {
      targetDrivers.forEach(driver => {
        io.to(driver._id.toString()).emit('newRideRequest', {
          ...populatedRide.toObject(),
          sponsoredBy: sponsoredBrandName
        });
      });
    } else {
      io.emit('newRideRequest', populatedRide);
    }

    res.status(201).json(ride);
  } catch (error) {
    console.error('Error booking ride:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/rides/schedule
// @desc    Schedule a ride for later
// @access  Private
router.post('/schedule', auth, async (req, res) => {
  const { pickup, dropoff, vehicleType, fare, pickupCoords, dropoffCoords, scheduledTime } = req.body;
  const riderId = req.user._id;

  try {
    if (!scheduledTime) {
      return res.status(400).json({ message: 'Scheduled time is required.' });
    }

    const ride = new Ride({
      riderId,
      pickup: { 
        type: 'Point',
        coordinates: [pickupCoords?.lng, pickupCoords?.lat],
        address: pickup
      },
      dropoff: { 
        type: 'Point',
        coordinates: [dropoffCoords?.lng, dropoffCoords?.lat],
        address: dropoff
      },
      vehicleType,
      fare,
      isScheduled: true,
      scheduledTime: new Date(scheduledTime),
      status: 'scheduled',
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
    });

    await ride.save();
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
        const distA = Math.sqrt(Math.pow(a.pickup.coordinates[1] - lat, 2) + Math.pow(a.pickup.coordinates[0] - lng, 2));
        const distB = Math.sqrt(Math.pow(b.pickup.coordinates[1] - lat, 2) + Math.pow(b.pickup.coordinates[0] - lng, 2));
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

const checkSubscription = require('../middleware/checkSubscription');

// @route   POST /api/rides/accept
// @desc    Accept a ride
// @access  Private
router.post('/accept', auth, checkSubscription, async (req, res) => {
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
    // if (driver.subscriptionStatus !== 'active' || (driver.subscriptionExpiry && new Date() > driver.subscriptionExpiry)) {
    //   driver.subscriptionStatus = 'expired';
    //   await driver.save();
    //   return res.status(403).json({ message: 'Please renew your subscription to accept rides' });
    // }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'searching') return res.status(400).json({ message: 'Ride already accepted' });

    ride.status = 'booked';
    ride.driverId = driverId;
    await ride.save();

    const populatedRide = await Ride.findById(ride._id).populate('riderId', 'name phone rating');

    // Notify rider that ride has been accepted
    const io = req.app.get('io');
    io.to(ride.riderId.toString()).emit('rideAccepted', populatedRide);
    
    // Also notify drivers to remove this ride from their list
    io.emit('rideTaken', rideId);

    res.json(populatedRide);
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

          // Handle Wallet Payment
          if (ride.paymentMethod === 'wallet') {
            if (rider.walletBalance < ride.fare) {
              throw new Error('Rider has insufficient balance');
            }
            // Deduct from rider
            rider.walletBalance -= ride.fare;
            await rider.save({ session });

            // Add to driver (Net earnings)
            driver.walletBalance += driverEarnings;
            await driver.save({ session });
          } 
          // Handle Cash Payment
          else {
            // Driver collected full fare in cash.
            // We need to DEDUCT the platform commission from driver's wallet.
            // If driver has insufficient balance, we might allow negative or block (for now allow negative)
            driver.walletBalance -= platformCommission;
            await driver.save({ session });
          }

          // Add loyalty points (10% of fare)
          const earnedPoints = Math.floor(ride.fare * 0.1);
          rider.loyaltyPoints = (rider.loyaltyPoints || 0) + earnedPoints;
          await rider.save({ session });

          // Create transactions
          const transactions = [
            {
              userId: rider._id,
              amount: ride.fare,
              type: 'debit',
              category: 'ride_fare',
              description: `Ride to ${ride.dropoff.address}`,
              rideId: ride._id,
              paymentMethod: ride.paymentMethod
            },
            {
              userId: driver._id,
              amount: ride.paymentMethod === 'wallet' ? driverEarnings : -platformCommission,
              type: ride.paymentMethod === 'wallet' ? 'credit' : 'debit',
              category: 'ride_fare',
              description: ride.paymentMethod === 'wallet' ? `Earnings from ride` : `Commission deduction for cash ride`,
              rideId: ride._id,
              paymentMethod: ride.paymentMethod
            }
          ];
          
          await Transaction.create(transactions, { session });
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

        if (ride.paymentMethod === 'wallet') {
          if (rider.walletBalance < ride.fare) {
            return res.status(400).json({ message: 'Rider has insufficient balance' });
          }
          // Deduct from rider
          rider.walletBalance -= ride.fare;
          await rider.save();
        }

        const earnedPoints = Math.floor(ride.fare * 0.1);
        rider.loyaltyPoints = (rider.loyaltyPoints || 0) + earnedPoints;
        await rider.save();

        // Add to driver
        if (ride.paymentMethod === 'wallet') {
          driver.walletBalance += ride.fare;
          await driver.save();
        }

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
    if (status === 'cancelled') {
       if (req.body.originalDriverId) {
          io.to(req.body.originalDriverId).emit('rideStatusUpdate', ride);
       }
       // If cancelled by driver, we should ideally re-queue the ride.
       // For now, we'll notify the rider so they can re-book or we can auto-retry on frontend.
       if (req.user.role === 'driver') {
         ride.driverId = null;
         ride.status = 'searching'; // Re-open for other drivers
         await ride.save();
         io.emit('newRideRequest', ride); // Broadcast to all drivers again
         io.to(ride.riderId.toString()).emit('rideStatusUpdate', { ...ride.toObject(), status: 'searching', message: 'Driver cancelled. Searching for new driver...' });
         return res.json(ride);
       }
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
  const { distance, duration, pickupCoords } = req.body;
  
  try {
    if (distance === undefined || duration === undefined || distance === null || duration === null) {
      return res.status(400).json({ message: 'Distance and duration are required' });
    }

    const distanceKm = Number(distance) / 1000;
    const durationMin = Number(duration) / 60;

    if (isNaN(distanceKm) || isNaN(durationMin)) {
      return res.status(400).json({ message: 'Invalid distance or duration' });
    }

    // Rates for different tiers
    const tiers = {
      go: { base: 40, perKm: 12, perMin: 1.5, minFare: 60, name: 'RideDeck Go' },
      premier: { base: 60, perKm: 18, perMin: 2.5, minFare: 100, name: 'RideDeck Premier' },
      xl: { base: 90, perKm: 25, perMin: 3.5, minFare: 150, name: 'RideDeck XL' }
    };

    // Calculate Surge Multiplier
    let surgeMultiplier = 1.0;
    let activeDrivers = 1; // Avoid division by zero
    let activeRequests = 0;

    if (pickupCoords && pickupCoords.lat && pickupCoords.lng) {
      try {
        // 1. Count Online Drivers in 5km radius
        activeDrivers = await User.countDocuments({
          role: 'driver',
          isOnline: true,
          subscriptionStatus: 'active',
          currentLocation: {
            $geoWithin: {
              $centerSphere: [[pickupCoords.lng, pickupCoords.lat], 5 / 6378.1] // 5km radius
            }
          }
        });

        // 2. Count Active Requests (Searching) in 5km radius
        activeRequests = await Ride.countDocuments({
          status: 'searching',
          pickup: {
            $geoWithin: {
              $centerSphere: [[pickupCoords.lng, pickupCoords.lat], 5 / 6378.1] // 5km radius
            }
          }
        });

        // 3. Calculate Ratio
        const ratio = activeRequests / (activeDrivers || 1);
        
        if (ratio > 3.0) surgeMultiplier = 2.0;
        else if (ratio > 2.0) surgeMultiplier = 1.5;
        else if (ratio > 1.5) surgeMultiplier = 1.2;
      } catch (surgeError) {
        console.error('Surge calculation error (using default 1.0):', surgeError.message);
        // Default to 1.0 is already set
      }
    }

    // Time of Day Surge (Peak Hours)
    const hour = new Date().getHours();
    if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 22)) {
      surgeMultiplier = Math.max(surgeMultiplier, 1.2); // Take the higher of demand surge or time surge
    }

    const estimates = {};
    const breakup = {}; // Detailed breakup for the 'go' tier (default)

    // Calculate for all tiers
    for (const [key, rate] of Object.entries(tiers)) {
      let fare = rate.base + (distanceKm * rate.perKm) + (durationMin * rate.perMin);
      fare = Math.max(fare, rate.minFare);
      
      const finalFare = Math.round(fare * surgeMultiplier);
      estimates[key] = finalFare;

      if (key === 'go') {
        breakup.base = rate.base;
        breakup.distanceFare = Math.round(distanceKm * rate.perKm);
        breakup.timeFare = Math.round(durationMin * rate.perMin);
        breakup.surge = surgeMultiplier;
        breakup.surgeAmount = Math.round(fare * (surgeMultiplier - 1));
      }
    }

    res.json({ 
      estimates,
      breakup,
      meta: {
        activeDrivers,
        activeRequests,
        surgeMultiplier
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/rides/sos
// @desc    Trigger SOS alert
// @access  Private
router.post('/sos', auth, async (req, res) => {
  const { rideId } = req.body;
  try {
    const ride = await Ride.findById(rideId).populate('riderId', 'name phone');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const io = req.app.get('io');
    if (io) {
      io.emit('admin-sos-alert', {
        userName: ride.riderId.name,
        rideId: ride._id,
        location: ride.pickup // In a real app, this would be current live location
      });
      // Also emit to specific admin room if you have one, e.g., io.to('admin-room').emit(...)

    }

    res.json({ message: 'SOS alert sent to authorities and admin' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/rides/:id/rate
// @desc    Rate a ride (for both rider and driver)
// @access  Private
router.post('/:id/rate', auth, async (req, res) => {
  const { rating, review } = req.body;
  const rideId = req.params.id;
  const userId = req.user._id;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    // Determine if user is rider or driver
    const isRider = ride.riderId.toString() === userId.toString();
    const isDriver = ride.driverId && ride.driverId.toString() === userId.toString();

    if (!isRider && !isDriver) {
      return res.status(403).json({ message: 'Not authorized to rate this ride' });
    }

    // Update Ride
    if (isRider) {
      ride.driverRating = rating;
      ride.driverReview = review;
    } else {
      ride.riderRating = rating;
      ride.riderReview = review;
    }
    await ride.save();

    // Update User Rating (The person BEING rated)
    const targetUserId = isRider ? ride.driverId : ride.riderId;
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser) {
        // Calculate new average
        const currentTotal = targetUser.rating * targetUser.totalRatings;
        targetUser.totalRatings += 1;
        targetUser.rating = (currentTotal + rating) / targetUser.totalRatings;
        await targetUser.save();
      }
    }

    res.json({ message: 'Rating submitted successfully', ride });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/rides/history
// @desc    Get ride history for current user
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      $or: [{ riderId: req.user._id }, { driverId: req.user._id }],
      status: { $in: ['completed', 'cancelled'] }
    };

    const rides = await Ride.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('riderId', 'name rating')
      .populate('driverId', 'name rating vehicleNumber vehicleType');

    const total = await Ride.countDocuments(query);

    res.json({
      rides,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRides: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
