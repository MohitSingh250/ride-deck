const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Campaign = require('../models/Campaign');
const { auth } = require('../middleware/authMiddleware');
const checkSubscription = require('../middleware/checkSubscription');

const fallbackDriverService = require('../services/fallbackDriverService');

router.post('/book', auth, async (req, res) => {
    const { pickup, dropoff, vehicleType, fare, pickupCoords, dropoffCoords, paymentMethod } = req.body;
    const riderId = req.user._id;

    try {
      if (!pickup || !dropoff || !pickupCoords || !dropoffCoords || !fare) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      if (!pickupCoords.lat || !pickupCoords.lng || !dropoffCoords.lat || !dropoffCoords.lng) {
        return res.status(400).json({ message: 'Invalid coordinates' });
      }

      const existingRide = await Ride.findOne({ 
        riderId, 
        status: { $in: ['searching', 'booked', 'arrived', 'started', 'negotiating'] } 
      });

      if (existingRide) {
        return res.status(400).json({ message: 'You already have an active ride.' });
      }

      const user = await User.findById(riderId);
      
      if (paymentMethod === 'wallet' && user.walletBalance < fare) {
        return res.status(400).json({ message: 'Insufficient wallet balance. Please top up or select Cash.' });
      }

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
        riderOffer: fare,
        paymentMethod: paymentMethod || 'cash',
        otp: Math.floor(1000 + Math.random() * 9000).toString(),
      });

      await ride.save();

      let driverVehicleType = 'cab';
      if (vehicleType === 'bike') driverVehicleType = 'bike';
      if (vehicleType === 'auto') driverVehicleType = 'auto';

      const query = {
        role: 'driver',
        isOnline: true,
        vehicleType: driverVehicleType,
        currentLocation: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [pickupLng, pickupLat]
            },
            $maxDistance: 5000
          }
        }
      };

      if (vehicleType === 'premier') {
        query.rating = { $gte: 4.7 };
      }

      let nearbyDrivers = await User.find(query).limit(30);

      nearbyDrivers.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.currentLocation.coordinates[1] - pickupLat, 2) + Math.pow(a.currentLocation.coordinates[0] - pickupLng, 2));
        const distB = Math.sqrt(Math.pow(b.currentLocation.coordinates[1] - pickupLat, 2) + Math.pow(b.currentLocation.coordinates[0] - pickupLng, 2));
        
        if (Math.abs(distA - distB) < 0.005) {
          return b.rating - a.rating;
        }
        return distA - distB;
      });

      nearbyDrivers = nearbyDrivers.slice(0, 15);

      let sponsoredBrandName = null;

      const sponsoredCampaign = await Campaign.findOne({
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [pickupLng, pickupLat]
            },
            $maxDistance: 500
          }
        }
      }).populate('brandId');

      if (sponsoredCampaign && sponsoredCampaign.brandId) {
        sponsoredBrandName = sponsoredCampaign.brandId.name;
      }

      let targetDrivers = nearbyDrivers;
      if (sponsoredBrandName) {
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
        // ACTIVATE FALLBACK SYSTEM
        console.log(`🎯 [Fallback] No drivers found for ride ${ride._id}. Activating simulation.`);
        io.to(riderId.toString()).emit('fallback_driver_triggered', {
          rideId: ride._id,
          message: 'Searching for nearby partners...'
        });
        
        fallbackDriverService.triggerFallback(
          io,
          riderId.toString(),
          ride._id.toString(),
          {
            pickup: ride.pickup,
            dropoff: ride.dropoff,
            fare: ride.fare
          }
        );
      }

      res.status(201).json(ride);
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


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

router.get('/available', auth, async (req, res) => {
  const { lat, lng } = req.query;
  
  try {
    let query = { status: 'searching' };
    let rides = await Ride.find(query).populate('riderId', 'name phone rating');

    if (lat && lng) {
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

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'searching') return res.status(400).json({ message: 'Ride already accepted' });

    ride.status = 'booked';
    ride.driverId = driverId;
    await ride.save();

    const populatedRide = await Ride.findById(ride._id).populate('riderId', 'name phone rating');

    const io = req.app.get('io');
    io.to(ride.riderId.toString()).emit('rideAccepted', populatedRide);
    
    io.emit('rideTaken', rideId);

    res.json(populatedRide);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

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
    
    if (status === 'started') {
      if (req.body.otp !== ride.otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
      ride.status = 'started';
    }

    if (status === 'completed') {
      const platformCommission = ride.fare * 0.2;
      const brandSubsidy = req.body.sponsoredBy ? 20 : 0;
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

          if (ride.paymentMethod === 'wallet') {
            if (rider.walletBalance < ride.fare) {
              throw new Error('Rider has insufficient balance');
            }
            rider.walletBalance -= ride.fare;
            await rider.save({ session });

            driver.walletBalance += driverEarnings;
            await driver.save({ session });
          } 
          else {
            driver.walletBalance -= platformCommission;
            await driver.save({ session });
          }

          const earnedPoints = Math.floor(ride.fare * 0.1);
          rider.loyaltyPoints = (rider.loyaltyPoints || 0) + earnedPoints;
          await rider.save({ session });

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
        const rider = await User.findById(ride.riderId);
        const driver = await User.findById(ride.driverId);

        if (!rider || !driver) {
          return res.status(404).json({ message: 'Rider or Driver not found' });
        }

        if (ride.paymentMethod === 'wallet') {
          if (rider.walletBalance < ride.fare) {
            return res.status(400).json({ message: 'Rider has insufficient balance' });
          }
          rider.walletBalance -= ride.fare;
          await rider.save();
        }

        const earnedPoints = Math.floor(ride.fare * 0.1);
        rider.loyaltyPoints = (rider.loyaltyPoints || 0) + earnedPoints;
        await rider.save();

        if (ride.paymentMethod === 'wallet') {
          driver.walletBalance += driverEarnings;
          await driver.save();
        } else {
          driver.walletBalance -= platformCommission;
          await driver.save();
        }

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
        
        await Transaction.create(transactions);
      }
    }

    await ride.save();

    const io = req.app.get('io');
    if (ride.riderId) io.to(ride.riderId.toString()).emit('rideStatusUpdate', ride);
    if (ride.driverId) io.to(ride.driverId.toString()).emit('rideStatusUpdate', ride);
    
    if (status === 'cancelled') {
       if (req.body.originalDriverId) {
          io.to(req.body.originalDriverId).emit('rideStatusUpdate', ride);
       }
       if (req.user.role === 'driver') {
         ride.driverId = null;
         ride.status = 'searching';
         await ride.save();
         io.emit('newRideRequest', ride);
         io.to(ride.riderId.toString()).emit('rideStatusUpdate', { ...ride.toObject(), status: 'searching', message: 'Driver cancelled. Searching for new driver...' });
         return res.json(ride);
       }
    }

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

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

    const tiers = {
      go: { base: 40, perKm: 12, perMin: 1.5, minFare: 60, name: 'RideDeck Go' },
      premier: { base: 60, perKm: 18, perMin: 2.5, minFare: 100, name: 'RideDeck Premier' },
      xl: { base: 90, perKm: 25, perMin: 3.5, minFare: 150, name: 'RideDeck XL' }
    };

    let surgeMultiplier = 1.0;
    let activeDrivers = 1;
    let activeRequests = 0;

    if (pickupCoords && pickupCoords.lat && pickupCoords.lng) {
      try {
        activeDrivers = await User.countDocuments({
          role: 'driver',
          isOnline: true,
          subscriptionStatus: 'active',
          currentLocation: {
            $geoWithin: {
              $centerSphere: [[pickupCoords.lng, pickupCoords.lat], 5 / 6378.1]
            }
          }
        });

        activeRequests = await Ride.countDocuments({
          status: 'searching',
          pickup: {
            $geoWithin: {
              $centerSphere: [[pickupCoords.lng, pickupCoords.lat], 5 / 6378.1]
            }
          }
        });

        const ratio = activeRequests / (activeDrivers || 1);
        
        if (ratio > 3.0) surgeMultiplier = 2.0;
        else if (ratio > 2.0) surgeMultiplier = 1.5;
        else if (ratio > 1.5) surgeMultiplier = 1.2;
      } catch (surgeError) {
      }
    }

    const hour = new Date().getHours();
    if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 22)) {
      surgeMultiplier = Math.max(surgeMultiplier, 1.2);
    }

    const estimates = {};
    const breakup = {};

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
        location: ride.pickup
      });
    }

    res.json({ message: 'SOS alert sent to authorities and admin' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.post('/:id/rate', auth, async (req, res) => {
  const { rating, review } = req.body;
  const rideId = req.params.id;
  const userId = req.user._id;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const isRider = ride.riderId.toString() === userId.toString();
    const isDriver = ride.driverId && ride.driverId.toString() === userId.toString();

    if (!isRider && !isDriver) {
      return res.status(403).json({ message: 'Not authorized to rate this ride' });
    }

    if (isRider) {
      ride.driverRating = rating;
      ride.driverReview = review;
    } else {
      ride.riderRating = rating;
      ride.riderReview = review;
    }
    await ride.save();

    const targetUserId = isRider ? ride.driverId : ride.riderId;
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser) {
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

router.post('/offer', auth, async (req, res) => {
  const { rideId, amount, eta } = req.body;
  const driverId = req.user._id;

  try {
    const driver = await User.findById(req.user.id);
    if (driver.role !== 'driver') return res.status(403).json({ message: 'Only drivers can make offers' });

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const offerData = {
      driverId,
      amount,
      eta,
      driverName: driver.name,
      rating: driver.rating,
      vehicleType: driver.vehicleType,
      vehicleNumber: driver.vehicleNumber,
      createdAt: new Date()
    };

    ride.offers.push(offerData);
    ride.status = 'negotiating';
    await ride.save();

    const io = req.app.get('io');
    io.to(ride.riderId.toString()).emit('newOffer', { rideId, offer: offerData });

    res.json({ message: 'Offer sent', offer: offerData });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.post('/boost-fare', auth, async (req, res) => {
  const { rideId, increment } = req.body;
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    
    ride.fare += increment;
    ride.riderOffer += increment;
    await ride.save();

    const io = req.app.get('io');
    io.emit('rideUpdate', { type: 'fare_boost', rideId, newFare: ride.fare, ride });

    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.post('/accept-offer', auth, async (req, res) => {
  const { rideId, driverId, amount } = req.body;
  const riderId = req.user._id;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    // Handle fallback driver
    if (typeof driverId === 'string' && driverId.startsWith('fallback_')) {
      const persona = fallbackDriverService.FALLBACK_PERSONAS.find(p => p.id === driverId);
      if (persona) {
        const io = req.app.get('io');
        await fallbackDriverService.handleRiderAcceptFallback(
          io,
          riderId.toString(),
          rideId,
          persona,
          amount,
          { pickup: ride.pickup }
        );
        const updatedRide = await Ride.findById(rideId);
        return res.json(updatedRide);
      }
    }

    // Handle regular driver
    const offer = ride.offers.find(o => o.driverId.toString() === driverId && o.amount === amount);
    if (!offer && amount !== ride.riderOffer) {
      return res.status(400).json({ message: 'Offer not found or changed' });
    }

    ride.driverId = driverId;
    ride.fare = amount;
    ride.status = 'booked';
    ride.offers = [];
    await ride.save();

    const populatedRide = await Ride.findById(ride._id)
      .populate('riderId', 'name phone rating')
      .populate('driverId', 'name phone vehicleNumber vehicleType rating');

    const io = req.app.get('io');
    io.to(driverId.toString()).emit('rideAccepted', populatedRide);

    res.json(populatedRide);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
