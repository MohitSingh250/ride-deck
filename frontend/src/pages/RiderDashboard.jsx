import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Calendar, ChevronRight, Star, Shield, MessageSquare, Phone, X, ArrowRight, Info, CreditCard, User, Gift, Bell, Share2, AlertTriangle, Music, Award, ChevronDown, Car, Banknote, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import Map from '../components/Map';
import Modal from '../components/Modal';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import InRideOffer from '../components/InRideOffer';

const RiderDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [rideStatus, setRideStatus] = useState('idle'); // idle, searching, booked, in-ride, completed
  const [currentRide, setCurrentRide] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [showReserve, setShowReserve] = useState(false);
  const [reserveDate, setReserveDate] = useState('');
  const [reserveTime, setReserveTime] = useState('');

  const [driver, setDriver] = useState(null);
  const [fare, setFare] = useState(null);
  const [fareBreakup, setFareBreakup] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [estimates, setEstimates] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('go');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showSavedPlaces, setShowSavedPlaces] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [bookingForSelf, setBookingForSelf] = useState(true);
  const [riderName, setRiderName] = useState('');
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [hasSeenOffer, setHasSeenOffer] = useState(false);

  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [showSimulateOffer, setShowSimulateOffer] = useState(false);
  
  // Negotiation State
  const [offers, setOffers] = useState([]);
  const [isFallbackTriggered, setIsFallbackTriggered] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/brands/all-active`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setActiveCampaigns(data);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };
    if (user) fetchCampaigns();
  }, [user]);

  const handleSimulateOffer = () => {
    if (activeCampaigns.length > 0) {
      setActiveCampaign(activeCampaigns[0]);
      setHasSeenOffer(true);
    } else {
      toast.error('No active campaigns to simulate');
    }
  };

  useEffect(() => {
    if (currentRide?.status === 'completed' && !currentRide.riderRating) {
      setShowRatingModal(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [currentRide?.status]);

  // Poll for nearby brands during ride
  useEffect(() => {
    let interval;
    if (rideStatus === 'in-ride' && !hasSeenOffer && driver?.location) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/brands/nearby?lat=${driver.location.lat}&lng=${driver.location.lng}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          if (response.ok) {
            const campaign = await response.json();
            if (campaign) {
              setActiveCampaign(campaign);
              setHasSeenOffer(true); // Only show one offer per ride
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error('Error fetching brands:', error);
        }
      }, 30000); // Check every 30 seconds
    }
    return () => clearInterval(interval);
  }, [rideStatus, hasSeenOffer, driver?.location, user.token]);

  const handleSaveCoupon = async (campaignId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/brands/save-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ campaignId })
      });
      if (response.ok) {
        toast.success('Coupon saved to Wallet!');
        setActiveCampaign(null);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to save coupon');
      }
    } catch (error) {
      toast.error('Error saving coupon');
    }
  };

  const handleSubmitRating = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rides/${currentRide._id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ rating, review })
      });
      if (response.ok) {
        toast.success('Rating submitted!');
        setShowRatingModal(false);
        setCurrentRide(null); // Clear ride after rating
        setRating(0);
        setReview('');
      } else {
        toast.error('Failed to submit rating');
      }
    } catch (error) {
      toast.error('Error submitting rating');
    }
  };


  const handleCancelRide = async (rideIdOverride) => {
    const idToCancel = rideIdOverride || currentRide?._id;
    if (!idToCancel) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/rides/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          rideId: idToCancel,
          status: 'cancelled'
        })
      });

      if (response.ok) {
        setRideStatus('idle');
        setDriver(null);
        setCurrentRide(null);
        toast.success('Ride cancelled');
      }
    } catch (error) {
      toast.error('Failed to cancel ride');
    }
  };

  useEffect(() => {
    const fetchCurrentRide = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/rides/my-ride`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (response.ok) {
          const ride = await response.json();
          if (ride) {
            setCurrentRide(ride);
            
            if (ride.status === 'searching') {
              setRideStatus('searching');
              // We don't auto-cancel here anymore. Let the user decide or let the existing timeout (if any) handle it.
              // If we wanted to enforce a timeout, we would need to re-establish it based on createdAt, 
              // but for now, we'll trust the user to cancel if they are tired of waiting.
            } else {
              setRideStatus(ride.status === 'accepted' ? 'booked' : 
                           ride.status === 'started' ? 'in-ride' : 
                           ride.status === 'arrived' ? 'arrived' : 
                           ride.status === 'completed' ? 'completed' : 'idle');
            }

            if (ride.driverId) setDriver(ride.driverId);
            setPickup(ride.pickup.address);
            setDropoff(ride.dropoff.address);
            setPickupCoords([ride.pickup.lat, ride.pickup.lng]);
            setDropoffCoords([ride.dropoff.lat, ride.dropoff.lng]);
          }
        }
      } catch (error) {
        console.error('Error fetching current ride:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentRide();
  }, [user.token]);

  useEffect(() => {
    const fetchSavedPlaces = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/profile`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSavedPlaces(data.savedPlaces || []);
        }
      } catch (error) {
        console.error('Error fetching saved places:', error);
      }
    };
    if (showSavedPlaces) fetchSavedPlaces();
  }, [showSavedPlaces, user.token]);

  const handleAddSavedPlace = async (name, address, lat, lng) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/saved-places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ name, address, lat, lng })
      });
      if (response.ok) {
        const updatedPlaces = await response.json();
        setSavedPlaces(updatedPlaces);
        toast.success('Place saved!');
      }
    } catch (error) {
      toast.error('Failed to save place');
    }
  };

  useEffect(() => {
    if (!socket) return;
    
    socket.on('rideAccepted', (data) => {
      setDriver(data.driverId);
      setCurrentRide(data);
      setRideStatus('booked');
      toast.success('Driver found!');
    });

    socket.on('rideStatusUpdate', (data) => {
      if (data.status === 'arrived') {
        setRideStatus('arrived');
        toast.success('Driver has arrived!');
      }
      if (data.status === 'started') {
        setRideStatus('in-ride');
        toast.success('Ride started!');
      }
      if (data.status === 'completed') {
        setRideStatus('completed');
        toast.success('Ride completed!');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => navigate('/history'), 3000);
      }
      if (data.status === 'cancelled') {
        setRideStatus('idle');
        setDriver(null);
        setCurrentRide(null);
        toast.error('Ride was cancelled');
      }
    });

    socket.on('location-update', (data) => {
      setDriver(prev => {
        if (prev && prev._id === data.driverId) {
          return { ...prev, location: data.location };
        }
        return prev;
      });
    });

    socket.on('newOffer', (data) => {
      console.log('New offer received:', data);
      setOffers(prev => {
        const index = prev.findIndex(o => o.driverId === data.offer.driverId);
        if (index >= 0) {
          const newOffers = [...prev];
          newOffers[index] = data.offer;
          return newOffers;
        }
        return [data.offer, ...prev];
      });
      setRideStatus('negotiating');
      toast.success(`New offer: ₹${data.offer.amount}`, { icon: '💰' });
    });

    socket.on('fallback_driver_triggered', (data) => {
      setIsFallbackTriggered(true);
      toast('Finding available partners...', { icon: '🤖' });
    });

    return () => {
      socket.off('rideAccepted');
      socket.off('rideStatusUpdate');
      socket.off('location-update');
    };
  }, [socket]);

  const fetchSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/rides/search-location?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    }, 500); // 500ms debounce
    
    setSearchTimeout(timeout);
  };

  const handleSelectLocation = (loc) => {
    const coords = [parseFloat(loc.lat), parseFloat(loc.lon)];
    if (activeInput === 'pickup') {
      setPickup(loc.display_name);
      setPickupCoords(coords);
    } else {
      setDropoff(loc.display_name);
      setDropoffCoords(coords);
    }
    setSuggestions([]);
    setActiveInput(null);
  };

  const handleRouteFound = async ({ distance, duration }) => {
    setDistance(distance);
    setDuration(duration);
    
    // Fetch real fare estimates
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/rides/estimate-fare`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          distance, 
          duration,
          pickupCoords: pickupCoords ? { lat: pickupCoords[0], lng: pickupCoords[1] } : null
        })
      });
      const data = await response.json();
      if (response.ok) {
        setEstimates(data.estimates);
        setFare(data.estimates.go); // Default to Go
        setFareBreakup(data.breakup);
        setSelectedVehicle('go');
      } else {
        toast.error(data.message || 'Failed to estimate fare');
        setEstimates(null);
      }
    } catch (error) {
      console.error('Error estimating fare:', error);
      toast.error('Could not calculate fare. Please try again.');
      setEstimates(null);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);

  const handleAcceptOffer = async (offer) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/rides/accept-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          rideId: currentRide._id,
          driverId: offer.driverId,
          amount: offer.amount
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentRide(data);
        setDriver(data.driverId || data.fallbackDriver);
        setRideStatus('booked');
        setOffers([]);
        toast.success('Offer accepted!');
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to accept offer");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const handleRequestRide = async () => {
    if (!pickupCoords || !dropoffCoords) {
      toast.error('Please select pickup and dropoff locations');
      return;
    }

    if (!estimates) {
      toast.error('Please wait for fare estimates');
      return;
    }
    
    setRideStatus('searching');
    setOffers([]);
    setIsFallbackTriggered(false);
    
    // Start 60s timeout
    const timeout = setTimeout(() => {
      // Don't auto-cancel if we are negotiating or already booked
      setRideStatus(prev => {
        if (prev === 'searching') {
          toast.error('No drivers found. Please try again.');
          handleCancelRide(); 
          return 'idle';
        }
        return prev;
      });
    }, 60000);
    setSearchTimeout(timeout);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/rides/book`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          pickup,
          dropoff,
          vehicleType: selectedVehicle,
          fare: estimates[selectedVehicle],
          pickupCoords: { lat: pickupCoords[0], lng: pickupCoords[1] },
          dropoffCoords: { lat: dropoffCoords[0], lng: dropoffCoords[1] },
          paymentMethod
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        clearTimeout(timeout);
        setRideStatus('idle');
        toast.error(data.message || 'Failed to book ride');
      } else {
        setCurrentRide(data);
      }
    } catch (error) {
      clearTimeout(timeout);
      setRideStatus('idle');
      toast.error('Error booking ride. Please try again.');
    }
  };

  const handleSOS = async () => {
    if (!currentRide) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/rides/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ rideId: currentRide._id })
      });

      if (response.ok) {
        toast.error('SOS Alert Sent! Help is on the way.', { duration: 5000 });
      }
    } catch (error) {
      toast.error('Failed to send SOS');
    }
  };

  const handleScheduleRide = async () => {
    if (!pickup || !dropoff || !reserveDate || !reserveTime) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const scheduledTime = new Date(`${reserveDate}T${reserveTime}`);
      if (scheduledTime < new Date()) {
        toast.error('Please select a future time');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/rides/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          pickup,
          dropoff,
          vehicleType: 'go', // Default for scheduled
          fare: 0, // Will be calculated at time of ride or estimated now
          pickupCoords: { lat: pickupCoords?.[0] || 0, lng: pickupCoords?.[1] || 0 },
          dropoffCoords: { lat: dropoffCoords?.[0] || 0, lng: dropoffCoords?.[1] || 0 },
          scheduledTime: scheduledTime.toISOString()
        })
      });

      if (response.ok) {
        toast.success('Ride scheduled successfully!');
        setShowReserve(false);
        setReserveDate('');
        setReserveTime('');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to schedule ride');
      }
    } catch (error) {
      toast.error('Error scheduling ride');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col md:flex-row bg-white">
        {/* Sidebar Skeleton */}
        <div className="w-full md:w-[450px] p-6 space-y-6 border-r border-zinc-100 pt-20">
          <Skeleton className="h-10 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
          <div className="space-y-4 pt-8">
             <div className="flex gap-4">
               <Skeleton className="h-16 w-full rounded-xl" />
               <Skeleton className="h-16 w-full rounded-xl" />
             </div>
          </div>
          <div className="space-y-2 pt-8">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
        {/* Map Skeleton */}
        <div className="flex-1 bg-zinc-50 relative">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-hidden pt-16 relative">
      {/* Right Side: Map (Now Full Screen) */}
      <div className="flex-1 relative z-0">
        <Map 
          pickup={pickupCoords} 
          dropoff={dropoffCoords} 
          markers={[
            ...(driver?.location ? [{
              position: [driver.location.lat, driver.location.lng],
              icon: 'car',
              popup: 'Your Driver'
            }] : []),
            ...activeCampaigns.map(c => ({
              position: c.location.coordinates.slice().reverse(),
              icon: 'brand',
              logo: c.brandId.logo,
              popup: c.title
            }))
          ]}
          onRouteFound={handleRouteFound}
        />
      </div>

      {/* Wide Rectangular Booking Bar at Bottom */}
      <div className="booking-bar-container max-w-6xl">
        <div className="booking-bar-rect">
          <div className="flex-1 p-2 overflow-y-auto lg:overflow-visible custom-scrollbar">
            <AnimatePresence mode="wait">
              {!showReserve ? (
                <motion.div
                  key="booking"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3"
                >
                  <div className="flex-1 flex flex-col lg:flex-row gap-2">
                    <div className="input-group">
                      <div className="input-icon bg-black" />
                      <input
                        type="text"
                        placeholder="Pickup location"
                        value={pickup}
                        onChange={(e) => {
                          setPickup(e.target.value);
                          setActiveInput('pickup');
                          fetchSuggestions(e.target.value);
                        }}
                        className="uber-input-minimal"
                      />
                    </div>

                    <div className="input-group">
                      <div className="input-icon bg-black rounded-sm" />
                      <input
                        type="text"
                        placeholder="Where to?"
                        value={dropoff}
                        onChange={(e) => {
                          setDropoff(e.target.value);
                          setActiveInput('dropoff');
                          fetchSuggestions(e.target.value);
                        }}
                        className="uber-input-minimal"
                      />
                    </div>

                    {suggestions.length > 0 && (
                      <div className="absolute bottom-full mb-2 left-0 right-0 bg-white shadow-2xl rounded-2xl z-50 border border-zinc-100 overflow-hidden">
                        {suggestions.map((loc, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectLocation(loc)}
                            className="w-full px-4 py-3 text-left hover:bg-zinc-50 flex items-start gap-3 border-b border-zinc-50 last:border-0"
                          >
                            <MapPin className="h-4 w-4 text-zinc-400 mt-0.5" />
                            <div>
                              <p className="font-bold text-xs text-black">{loc.display_name.split(',')[0]}</p>
                              <p className="text-[10px] text-zinc-500 line-clamp-1">{loc.display_name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!pickupCoords || !dropoffCoords ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowSavedPlaces(true)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-zinc-100 rounded-[20px] hover:bg-zinc-200 transition-all"
                      >
                        <Star className="h-4 w-4" />
                        <span className="text-sm font-bold">Saved</span>
                      </button>
                      <button 
                        onClick={() => setShowReserve(true)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-zinc-100 rounded-[20px] hover:bg-zinc-200 transition-all"
                      >
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-bold">Reserve</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 flex-grow">
                       <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide no-scrollbar">
                        {[
                          { id: 'go', name: 'Go', icon: Car },
                          { id: 'premier', name: 'Premier', icon: Shield },
                          { id: 'xl', name: 'XL', icon: User },
                        ].map((type) => (
                          <button 
                            key={type.id} 
                            onClick={() => {
                              if (estimates) {
                                setSelectedVehicle(type.id);
                                setFare(estimates[type.id]);
                              }
                            }}
                            className={`flex-shrink-0 px-4 py-3 flex items-center gap-3 rounded-[20px] border-2 transition-all ${selectedVehicle === type.id ? 'border-black bg-zinc-50 shadow-sm' : 'border-transparent bg-zinc-100/50 hover:border-zinc-200'}`}
                          >
                            <type.icon className="h-5 w-5 text-black" />
                            <div className="text-left">
                              <p className="font-bold text-xs">{type.name}</p>
                              <p className="text-[9px] font-bold text-black">{estimates ? `₹${estimates[type.id]}` : '--'}</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2 flex-grow lg:flex-grow-0">
                        <button 
                          onClick={() => setPaymentMethod(paymentMethod === 'cash' ? 'wallet' : 'cash')}
                          className="px-4 py-4 bg-zinc-100 rounded-[20px] flex items-center justify-center gap-2 text-xs font-bold whitespace-nowrap"
                        >
                          {paymentMethod === 'cash' ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                          {paymentMethod.toUpperCase()}
                        </button>
                        <button 
                          onClick={handleRequestRide} 
                          disabled={!estimates || loading}
                          className="flex-grow lg:w-48 py-4 bg-black text-white rounded-[20px] font-bold text-sm disabled:opacity-50 active:scale-95 transition-all whitespace-nowrap"
                        >
                          {loading ? 'Requesting...' : `Request ${selectedVehicle.toUpperCase()}`}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="reserve"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex flex-col lg:flex-row items-center gap-4 w-full"
                >
                  <button onClick={() => setShowReserve(false)} className="p-3 bg-zinc-100 hover:bg-zinc-200 rounded-full">
                    <X className="h-5 w-5" />
                  </button>
                  <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                    <input type="date" value={reserveDate} onChange={(e) => setReserveDate(e.target.value)} className="w-full p-4 bg-zinc-100 rounded-[20px] text-sm font-semibold outline-none" />
                    <input type="time" value={reserveTime} onChange={(e) => setReserveTime(e.target.value)} className="w-full p-4 bg-zinc-100 rounded-[20px] text-sm font-semibold outline-none" />
                  </div>
                  <button onClick={handleScheduleRide} className="w-full lg:w-auto px-8 py-4 bg-black text-white rounded-[20px] font-bold text-sm">
                    Confirm Reservation
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:border-l border-zinc-100 px-4 py-2 flex lg:flex-col items-center justify-center gap-2 lg:gap-1">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
              {user?.name?.[0]}
            </div>
            <button 
              onClick={handleSimulateOffer}
              className="p-2 lg:p-1 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="View Offers"
            >
              <Gift className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Saved Places Modal */}
      <Modal isOpen={showSavedPlaces} onClose={() => setShowSavedPlaces(false)} title="Saved Places">
        <div className="p-4 space-y-4">
          {savedPlaces.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No saved places yet.</p>
          ) : (
            <div className="space-y-2">
              {savedPlaces.map((place, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    handleSelectLocation({ display_name: place.address, lat: place.lat, lon: place.lng });
                    setShowSavedPlaces(false);
                  }}
                  className="w-full p-3 flex items-center gap-3 hover:bg-zinc-50 rounded-xl transition-all text-left"
                >
                  <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <p className="font-bold text-black">{place.name}</p>
                    <p className="text-xs text-zinc-500 line-clamp-1">{place.address}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="pt-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 text-center">To add a place, search for it and click the star icon (coming soon).</p>
          </div>
        </div>
      </Modal>

      {/* Right Side: Map */}
      <div className="flex-1 relative h-full">
        <Map 
          pickup={pickupCoords} 
          dropoff={dropoffCoords} 
          markers={[
            ...(driver?.location ? [{
              position: [driver.location.lat, driver.location.lng],
              icon: 'car',
              popup: 'Your Driver'
            }] : []),
            ...activeCampaigns.map(c => ({
              position: c.location.coordinates.slice().reverse(), // GeoJSON is [lng, lat], Leaflet needs [lat, lng]
              icon: 'brand',
              logo: c.brandId.logo,
              popup: c.title
            }))
          ]}
          onRouteFound={handleRouteFound}
        />

        {/* Active Ride Overlay */}
        {/* Active Ride Overlay */}
        {['booked', 'arrived', 'in-ride'].includes(rideStatus) && driver && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-zinc-100 z-30"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-white font-bold text-xl border-2 border-black">
                  {driver.name ? driver.name[0] : 'D'}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {rideStatus === 'arrived' ? 'Driver Arrived' : 
                     rideStatus === 'in-ride' ? 'On Trip' : 
                     driver.name || 'Your Driver'}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                    <span className="text-sm font-bold">{driver.rating || '4.9'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl">{driver.vehicleNumber || 'DL 1C AB 1234'}</p>
                <p className="text-sm text-zinc-500">{driver.vehicleType || 'Cab'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="uber-btn-white py-3 flex items-center justify-center gap-2">
                <MessageSquare className="h-5 w-5" /> Chat
              </button>
              <button className="uber-btn-white py-3 flex items-center justify-center gap-2">
                <Phone className="h-5 w-5" /> Call
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center justify-between">
              {rideStatus !== 'in-ride' && (
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Share OTP</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-black text-black tracking-[0.3em]">{currentRide?.otp || '----'}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(currentRide?.otp);
                        toast.success('OTP Copied!');
                      }}
                      className="p-2 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-all"
                    >
                      <Share2 className="h-4 w-4 text-black" />
                    </button>
                  </div>
                </div>
              )}
              {rideStatus === 'in-ride' && (
                 <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Destination</p>
                  <p className="text-sm font-bold text-black line-clamp-1">{dropoff}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={handleSOS} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all">
                  <Shield className="h-6 w-6" />
                </button>
                {rideStatus !== 'in-ride' && (
                  <button onClick={() => setShowCancelWarning(true)} className="text-rose-500 font-bold hover:underline">Cancel Ride</button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Cancel Warning Modal */}
        <Modal isOpen={showCancelWarning} onClose={() => setShowCancelWarning(false)} title="Cancel Ride?">
          <div className="p-4 space-y-4">
            <p className="text-zinc-600">Are you sure you want to cancel? A cancellation fee may apply if the driver has already arrived.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowCancelWarning(false)} className="flex-1 py-3 bg-zinc-100 rounded-xl font-bold">No, Keep Ride</button>
              <button 
                onClick={() => {
                  handleCancelRide();
                  setShowCancelWarning(false);
                }} 
                className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </Modal>

        {/* Searching / Negotiating Overlay */}
        {(rideStatus === 'searching' || rideStatus === 'negotiating') && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-30 p-4">
            <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden">
              <div className="p-8 text-center space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                   <div className="absolute inset-0 border-4 border-zinc-100 rounded-full" />
                   <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Zap className="h-8 w-8 text-indigo-500 animate-pulse" />
                   </div>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-black">
                    {rideStatus === 'negotiating' ? 'Offers Found!' : 'Finding your ride'}
                  </h2>
                  <p className="text-zinc-500 font-medium">
                    {isFallbackTriggered ? 'Matching you with premium partners...' : 'Connecting to nearby drivers...'}
                  </p>
                </div>
              </div>

              {/* Offer Marketplace */}
              {offers.length > 0 && (
                <div className="px-6 pb-8 space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                  <AnimatePresence>
                    {offers.map((offer) => (
                      <motion.div
                        key={offer.driverId}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-zinc-50 p-4 rounded-2xl flex items-center justify-between border border-zinc-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-zinc-100 overflow-hidden">
                            {offer.avatar ? (
                              <img src={offer.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="h-6 w-6 text-zinc-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-black">{offer.driverName}</p>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                              <span className="text-[10px] font-black text-zinc-400">{offer.rating} • {offer.eta}m away</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-xl font-black text-black">₹{offer.amount}</p>
                          <button 
                            onClick={() => handleAcceptOffer(offer)}
                            className="bg-black text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                          >
                            Accept
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              <div className="p-6 bg-zinc-50 border-t border-zinc-100">
                <button onClick={() => handleCancelRide()} className="w-full py-4 text-rose-500 font-black text-sm uppercase tracking-widest">
                  Cancel Search
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Rating Modal */}
      <Modal isOpen={showRatingModal} onClose={() => {}} title="Rate your Driver">
        <div className="p-6 text-center space-y-6">
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            {currentRide?.driverId?.name?.[0]}
          </div>
          <div>
            <h3 className="text-xl font-bold">{currentRide?.driverId?.name}</h3>
            <p className="text-zinc-500">How was your ride?</p>
          </div>
          
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star 
                  className={`h-8 w-8 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'}`} 
                />
              </button>
            ))}
          </div>

          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write a review (optional)..."
            className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 outline-none focus:border-black min-h-[100px]"
          />

          <button
            onClick={handleSubmitRating}
            disabled={rating === 0}
            className="uber-btn-black w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Rating
          </button>
        </div>
      </Modal>

      <InRideOffer 
        campaign={activeCampaign}
        onSave={handleSaveCoupon}
        onDismiss={() => setActiveCampaign(null)}
      />
    </div>
  );
};

export default RiderDashboard;
