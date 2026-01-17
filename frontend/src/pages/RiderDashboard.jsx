import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Calendar, ChevronRight, Star, Shield, MessageSquare, Phone, X, ArrowRight, Info, CreditCard, User, Gift, Bell, Share2, AlertTriangle, Music, Award, ChevronDown, Car, Banknote } from 'lucide-react';
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
  const socket = useSocket();
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
              const createdAt = new Date(ride.createdAt).getTime();
              const elapsed = Date.now() - createdAt;
              const remaining = 60000 - elapsed;

              if (remaining > 0) {
                setRideStatus('searching');
                const timeout = setTimeout(() => {
                  setRideStatus('idle');
                  toast.error('No drivers found. Please try again.');
                  handleCancelRide(ride._id);
                }, remaining);
                setSearchTimeout(timeout);
              } else {
                // Time expired, cancel it
                handleCancelRide(ride._id);
                return; // Don't set other state if cancelled
              }
            } else {
              setRideStatus(ride.status === 'accepted' ? 'booked' : 
                           ride.status === 'started' ? 'in-ride' : 
                           ride.status === 'arrived' ? 'arrived' : 'idle');
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

    return () => {
      socket.off('rideAccepted');
      socket.off('rideStatusUpdate');
      socket.off('location-update');
    };
  }, [socket]);

  const fetchSuggestions = async (query) => {
    if (query.length < 3) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&countrycodes=in`);
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
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
    
    // Start 60s timeout
    const timeout = setTimeout(() => {
      setRideStatus('idle');
      toast.error('No drivers found. Please try again.');
      // Ideally call API to cancel the search on backend too
      handleCancelRide(); 
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
    <div className="h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden pt-16 relative">
      {/* Left Sidebar: Booking Flow */}
      <div className="fixed bottom-0 left-0 right-0 h-[45vh] lg:h-full lg:w-[450px] lg:relative lg:bottom-auto bg-white border-t lg:border-t-0 lg:border-r border-zinc-100 flex flex-col z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-xl rounded-t-3xl lg:rounded-none">
        <div className="p-6 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!showReserve ? (
              <motion.div
                key="booking"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-3xl font-bold text-black">Where to?</h1>
                  <div className="flex gap-2">
                    <button className="uber-btn-white px-3 py-2 text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Pickup now <ChevronDown className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setBookingForSelf(!bookingForSelf)}
                      className={`uber-btn-white px-3 py-2 text-sm flex items-center gap-2 ${!bookingForSelf ? 'bg-black text-white' : ''}`}
                    >
                      <User className="h-4 w-4" /> {bookingForSelf ? 'For me' : 'For someone'} <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {!bookingForSelf && (
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 mb-4">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Rider Name</label>
                    <input 
                      type="text" 
                      value={riderName}
                      onChange={(e) => setRiderName(e.target.value)}
                      placeholder="Enter rider's name"
                      className="w-full p-2 bg-white rounded-lg border border-zinc-200 outline-none focus:border-black"
                    />
                  </div>
                )}

                <div className="relative space-y-2">
                  {/* Vertical Line */}
                  <div className="absolute left-[23px] top-[24px] bottom-[24px] w-[1px] bg-zinc-300 z-0" />
                  
                  <div className="relative z-10">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full" />
                    <input
                      type="text"
                      placeholder="Enter pickup location"
                      value={pickup}
                      onChange={(e) => {
                        setPickup(e.target.value);
                        setActiveInput('pickup');
                        fetchSuggestions(e.target.value);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-zinc-100 rounded-lg font-medium focus:ring-2 focus:ring-black outline-none transition-all"
                    />
                  </div>

                  <div className="relative z-10">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-sm" />
                    <input
                      type="text"
                      placeholder="Enter destination"
                      value={dropoff}
                      onChange={(e) => {
                        setDropoff(e.target.value);
                        setActiveInput('dropoff');
                        fetchSuggestions(e.target.value);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-zinc-100 rounded-lg font-medium focus:ring-2 focus:ring-black outline-none transition-all"
                    />
                  </div>

                  {/* Suggestions Dropdown */}
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-xl mt-2 z-50 border border-zinc-100 overflow-hidden">
                      {suggestions.map((loc, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectLocation(loc)}
                          className="w-full px-4 py-3 text-left hover:bg-zinc-50 flex items-start gap-3 border-b border-zinc-50 last:border-0"
                        >
                          <MapPin className="h-5 w-5 text-zinc-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-sm text-black line-clamp-1">{loc.display_name.split(',')[0]}</p>
                            <p className="text-xs text-zinc-500 line-clamp-1">{loc.display_name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button 
                    onClick={() => setShowSavedPlaces(true)}
                    className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Star className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Saved</p>
                      <p className="text-xs text-zinc-500">Quick access</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setShowReserve(true)}
                    className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Calendar className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Reserve</p>
                      <p className="text-xs text-zinc-500">Plan ahead</p>
                    </div>
                  </button>
                </div>

                {/* Ride Selection (Simulated) */}
                {pickupCoords && dropoffCoords && (
                  <div className="mt-8 space-y-4">
                    <h3 className="font-bold text-lg">Choose a ride</h3>
                    <div className="space-y-2">
                      {[
                        { id: 'go', name: 'RideDeck Go', time: '3 min', icon: Car },
                        { id: 'premier', name: 'RideDeck Premier', time: '5 min', icon: Shield },
                        { id: 'xl', name: 'RideDeck XL', time: '8 min', icon: User },
                      ].map((type, i) => (
                        <button 
                          key={type.id} 
                          onClick={() => {
                            if (estimates) {
                              setSelectedVehicle(type.id);
                              setFare(estimates[type.id]);
                            }
                          }}
                          className={`w-full p-4 flex items-center justify-between rounded-xl border-2 transition-all group ${selectedVehicle === type.id ? 'border-black bg-zinc-50' : 'border-transparent hover:border-zinc-200'}`}
                        >
                          <div className="flex items-center gap-4">
                            <type.icon className="h-8 w-8 text-black" />
                            <div className="text-left">
                              <p className="font-bold">{type.name}</p>
                              <p className="text-xs text-zinc-500">{type.time} away</p>
                            </div>
                          </div>
                          <div className="font-bold text-lg flex items-center gap-2">
                            {estimates ? `₹${estimates[type.id]}` : '--'}
                            {fareBreakup && type.id === 'go' && (
                              <div className="group relative">
                                <Info className="h-4 w-4 text-zinc-400 cursor-pointer" />
                                <div className="absolute bottom-full right-0 mb-2 w-64 bg-white p-4 rounded-xl shadow-xl border border-zinc-100 hidden group-hover:block z-50">
                                  <h4 className="font-bold mb-2 text-sm">Fare Breakdown</h4>
                                  <div className="space-y-1 text-xs text-zinc-600">
                                    <div className="flex justify-between">
                                      <span>Base Fare</span>
                                      <span>₹{fareBreakup.base}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Distance ({((distance || 0) / 1000).toFixed(1)} km)</span>
                                      <span>₹{fareBreakup.distanceFare}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Time ({Math.round((duration || 0) / 60)} min)</span>
                                      <span>₹{fareBreakup.timeFare}</span>
                                    </div>
                                    {fareBreakup.surge > 1 && (
                                      <div className="flex justify-between text-amber-600 font-bold">
                                        <span>Surge ({fareBreakup.surge.toFixed(1)}x)</span>
                                        <span>+₹{fareBreakup.surgeAmount}</span>
                                      </div>
                                    )}
                                    {fareBreakup.discount > 0 && (
                                      <div className="flex justify-between text-emerald-600 font-bold">
                                        <span>Discount</span>
                                        <span>-₹{fareBreakup.discount}</span>
                                      </div>
                                    )}
                                    <div className="border-t border-zinc-100 pt-1 mt-1 flex justify-between font-bold text-black">
                                      <span>Total</span>
                                      <span>₹{fare}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="font-bold text-sm">Payment Method</p>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setPaymentMethod('cash')}
                          className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${paymentMethod === 'cash' ? 'border-black bg-black text-white' : 'border-zinc-100 bg-zinc-50 text-zinc-500'}`}
                        >
                          <Banknote className="h-5 w-5" /> Cash
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('wallet')}
                          className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${paymentMethod === 'wallet' ? 'border-black bg-black text-white' : 'border-zinc-100 bg-zinc-50 text-zinc-500'}`}
                        >
                          <CreditCard className="h-5 w-5" /> Wallet
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={handleRequestRide} 
                      disabled={!estimates || loading}
                      className={`w-full py-4 text-lg mt-4 ${!estimates || loading ? 'bg-zinc-300 cursor-not-allowed text-zinc-500' : 'uber-btn-black'}`}
                    >
                      {loading ? 'Calculating...' : 'Request RideDeck Go'}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="reserve"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowReserve(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                    <X className="h-6 w-6 text-black" />
                  </button>
                  <h1 className="text-3xl font-bold text-black">Reserve</h1>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Date</label>
                    <input 
                      type="date" 
                      value={reserveDate}
                      onChange={(e) => setReserveDate(e.target.value)}
                      className="w-full p-4 bg-zinc-100 rounded-lg font-medium outline-none focus:ring-2 focus:ring-black" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Time</label>
                    <input 
                      type="time" 
                      value={reserveTime}
                      onChange={(e) => setReserveTime(e.target.value)}
                      className="w-full p-4 bg-zinc-100 rounded-lg font-medium outline-none focus:ring-2 focus:ring-black" 
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-8">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <p className="font-bold">Choose your exact pickup time</p>
                      <p className="text-sm text-zinc-500">Up to 90 days in advance</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <p className="font-bold">Extra wait time included</p>
                      <p className="text-sm text-zinc-500">Your driver will wait up to 15 mins</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <X className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <p className="font-bold">Cancel at no charge</p>
                      <p className="text-sm text-zinc-500">Up to 60 minutes in advance</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleScheduleRide}
                  className="uber-btn-black w-full py-4 text-lg mt-8"
                >
                  Reserve a ride
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Bar: Quick Info */}
        <div className="p-6 border-t border-zinc-100 bg-zinc-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <CreditCard className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="font-bold text-sm">Personal</p>
                <p className="text-xs text-zinc-500">**** 1234</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleSimulateOffer} 
                className="text-[10px] font-bold text-indigo-500 bg-indigo-50/50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-all border border-indigo-100 flex items-center gap-1"
              >
                <Gift className="h-3 w-3" /> Simulate Offer
              </button>
              <button className="text-sm font-bold text-black hover:underline">Change</button>
            </div>
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

        {/* Searching Overlay */}
        {rideStatus === 'searching' && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-zinc-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-black rounded-full border-t-transparent animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Finding your ride</h2>
                <p className="text-zinc-500">Connecting you to nearby drivers...</p>
              </div>
              <button onClick={() => handleCancelRide()} className="uber-btn-white w-full">Cancel</button>
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
