import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Star, Car, Bike, Truck, CheckCircle, Bell, Gift, Map as MapIcon, X, Wallet as WalletIcon, AlertCircle, Shield, Share2, MessageSquare, Send, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Map from '../components/Map';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

const RiderDashboard = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('bike');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('');
  const [currentRide, setCurrentRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeDetails, setRouteDetails] = useState(null);
  const [calculatedFares, setCalculatedFares] = useState({ bike: 0, auto: 0, cab: 0 });
  const [brands, setBrands] = useState([]);
  const [nearbyBrand, setNearbyBrand] = useState(null);
  const [searchingMessage, setSearchingMessage] = useState('Finding your ride...');
  const [showBrandNotification, setShowBrandNotification] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const vehicles = [
    { id: 'bike', name: 'Bike', icon: Bike, price: `₹${calculatedFares.bike}`, time: routeDetails ? `${Math.round(routeDetails.duration / 60)} min` : '5 min' },
    { id: 'auto', name: 'Auto', icon: Truck, price: `₹${calculatedFares.auto}`, time: routeDetails ? `${Math.round(routeDetails.duration / 60)} min` : '8 min' },
    { id: 'cab', name: 'Cab', icon: Car, price: `₹${calculatedFares.cab}`, time: routeDetails ? `${Math.round(routeDetails.duration / 60)} min` : '12 min' },
  ];

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const [walletBalance, setWalletBalance] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [notifiedBrands, setNotifiedBrands] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastRide, setLastRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    const fetchActiveRide = async () => {
      try {
        const response = await fetch(`${API_URL}/api/rides/my-ride`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await response.json();
        if (data) {
          setCurrentRide(data);
          if (data.status === 'completed') setShowRatingModal(true);
        }
      } catch (error) {
        console.error('Error fetching ride:', error);
      }
    };

    const fetchBrands = async () => {
      try {
        const response = await fetch(`${API_URL}/api/brands`);
        const data = await response.json();
        setBrands(data);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };

    const fetchWallet = async () => {
      try {
        const response = await fetch(`${API_URL}/api/wallet/history`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setWalletBalance(data.balance);
          setLoyaltyPoints(data.loyaltyPoints || 0);
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
      }
    };

    if (user) {
      fetchActiveRide();
      fetchBrands();
      fetchWallet();
    }
  }, [user, API_URL]);

  useEffect(() => {
    if (!socket) return;

    socket.on('rideAccepted', (ride) => {
      setCurrentRide(ride);
      setBookingStatus('Driver Accepted!');
      toast.success('Driver found!');
    });

    socket.on('ride-completed', (ride) => {
      setLastRide(ride);
      setCurrentRide(null);
      setShowReceipt(true);
      setShowRatingModal(true); // Show rating modal along with receipt
      toast.success('Ride completed! Receipt generated.');
    });

    socket.on('rideStatusUpdate', (ride) => {
      setCurrentRide(ride);
      if (ride.status === 'started') {
        setBookingStatus('Ride Started!');
        toast.success('Your ride has started!');
      }
      if (ride.status === 'completed') {
        setBookingStatus('Ride Completed!');
        setShowRatingModal(true);
      }
      if (ride.status === 'cancelled') {
        setCurrentRide(null);
        setBookingStatus('');
        setRouteDetails(null);
        setCalculatedFares(null);
        toast.error('Ride cancelled');
      }
    });

    socket.on('receive-message', (data) => {
      setChatMessages(prev => [...prev, { ...data, type: 'received' }]);
      if (!showChat) toast.success(`New message from ${data.senderName}`);
    });

    socket.on('location-update', ({ location }) => {
      setDriverLocation([location.lat, location.lng]);
    });

    socket.on('driver-arrived', () => {
      toast.success('Your driver has arrived at the pickup location!', {
        duration: 5000,
        icon: '🚗'
      });
    });

    const searchingMessages = [
      'Finding your ride...',
      'Contacting nearby drivers...',
      'Checking vehicle availability...',
      'Almost there...',
      'Still searching for the best driver for you...'
    ];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      setSearchingMessage(searchingMessages[msgIndex]);
      msgIndex = (msgIndex + 1) % searchingMessages.length;
    }, 3000);

    return () => {
      socket.off('rideAccepted');
      socket.off('rideStatusUpdate');
      socket.off('receive-message');
      clearInterval(msgInterval);
    };
  }, [socket, showChat]);


  useEffect(() => {
    if (currentRide?.status === 'started') {
      setNotifiedBrands([]); // Reset for new ride
    }
  }, [currentRide?.status]);

  useEffect(() => {
    if (currentRide?.status === 'started' && driverLocation) {
      const coord = { lat: driverLocation[0], lng: driverLocation[1] };
      
      // Check for nearby brands
      brands.forEach(brand => {
        if (notifiedBrands.includes(brand._id)) return;

        brand.locations.forEach(loc => {
          const dist = Math.sqrt(Math.pow(coord.lat - loc.lat, 2) + Math.pow(coord.lng - loc.lng, 2));
          if (dist < 0.005) { // Roughly 500m
            setNearbyBrand(brand);
            setShowBrandNotification(true);
            setNotifiedBrands(prev => [...prev, brand._id]);
          }
        });
      });
    }
  }, [currentRide?.status, driverLocation, brands, notifiedBrands]);

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);

  const searchLocation = async (query, setSuggestions) => {
    if (query.length < 3) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&countrycodes=in`);
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handleSelectLocation = (loc, type) => {
    if (type === 'pickup') {
      setPickup(loc.display_name);
      setPickupSuggestions([]);
      setRouteDetails(prev => ({ ...prev, pickup: { lat: parseFloat(loc.lat), lng: parseFloat(loc.lon) } }));
    } else {
      setDropoff(loc.display_name);
      setDropoffSuggestions([]);
      setRouteDetails(prev => ({ ...prev, dropoff: { lat: parseFloat(loc.lat), lng: parseFloat(loc.lon) } }));
    }
  };

  const [fareBreakups, setFareBreakups] = useState({});

  const handleRouteFound = React.useCallback(async (details) => {
    setRouteDetails(prev => ({
      ...prev,
      ...details
    }));
    
    try {
      // Use the latest coordinates from the state or props
      // Since we're in a callback, we can't easily get the latest state without a ref or functional update
      // But we know the pickup/dropoff are in the parent scope or we can pass them to handleRouteFound
      
      const farePromises = ['bike', 'auto', 'cab'].map(type => 
        fetch(`${API_URL}/api/rides/estimate-fare`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            distance: details.distance,
            duration: details.duration,
            vehicleType: type,
            // These will be captured from the closure
            pickupCoords: routeDetails?.pickup,
            dropoffCoords: routeDetails?.dropoff
          })
        }).then(res => res.json())
      );

      const results = await Promise.all(farePromises);
      setCalculatedFares({
        bike: results[0].fare,
        auto: results[1].fare,
        cab: results[2].fare
      });
      setFareBreakups({
        bike: results[0].breakup,
        auto: results[1].breakup,
        cab: results[2].breakup
      });
    } catch (error) {
      console.error('Error estimating fares:', error);
      // Fallback
      const distanceKm = details.distance / 1000;
      setCalculatedFares({
        bike: Math.round(20 + distanceKm * 8),
        auto: Math.round(30 + distanceKm * 12),
        cab: Math.round(50 + distanceKm * 18),
      });
    }
  }, [API_URL, user.token, routeDetails?.pickup, routeDetails?.dropoff]);

  const handleSOS = () => {
    if (!currentRide) return;
    socket.emit('sos-alert', {
      userId: user._id,
      userName: user.name,
      location: currentRide.pickup, // In real app, use current GPS
      rideId: currentRide._id
    });
    toast.error('SOS Alert Sent! Emergency services notified.', {
      duration: 5000,
      icon: '🚨'
    });
  };

  const handleShareTrip = () => {
    if (!currentRide) return;
    const shareData = {
      title: 'RideDeck Trip',
      text: `I'm on my way! Track my ride: ${currentRide.pickup.address} to ${currentRide.dropoff.address}`,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      socket.emit('share-trip', {
        rideId: currentRide._id,
        riderName: user.name,
        location: currentRide.pickup,
        destination: currentRide.dropoff
      });
      toast.success('Trip details shared with emergency contacts');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentRide?.driverId) return;

    const messageData = {
      to: currentRide.driverId._id,
      message: chatInput,
      senderName: user.name
    };

    socket.emit('send-message', messageData);
    setChatMessages(prev => [...prev, { ...messageData, type: 'sent', timestamp: new Date() }]);
    setChatInput('');
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!pickup || !dropoff) {
      toast.error('Please enter pickup and dropoff locations');
      return;
    }
    
    setLoading(true);
    setBookingStatus('Finding a driver...');
    
    try {
      const response = await fetch(`${API_URL}/api/rides/book`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          pickup,
          dropoff,
          pickupCoords: routeDetails?.pickup,
          dropoffCoords: routeDetails?.dropoff,
          vehicleType: selectedVehicle,
          fare: calculatedFares[selectedVehicle]
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setCurrentRide(data);
        toast.success('Ride requested successfully!');
      } else {
        setBookingStatus('Booking Failed: ' + data.message);
        toast.error(data.message || 'Booking failed');
      }
    } catch (error) {
      setBookingStatus('Error: ' + error.message);
      toast.error('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    setShowCancelConfirm(false);
    try {
      const response = await fetch(`${API_URL}/api/rides/update-status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          rideId: currentRide._id, 
          status: 'cancelled',
          originalDriverId: currentRide.driverId?._id || currentRide.driverId
        }),
      });
      
      if (response.ok) {
        setCurrentRide(null);
        setBookingStatus('');
        setRouteDetails(null);
        setCalculatedFares(null);
        toast.success('Ride cancelled successfully');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to cancel ride');
    }
  };

  const handleClaimOffer = async (brandId) => {
    try {
      const response = await fetch(`${API_URL}/api/brands/claim`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ brandId }),
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success('Offer claimed! Check your Deals page.');
        setShowBrandNotification(false);
      } else {
        toast.error(data.message || 'Failed to claim offer');
      }
    } catch (error) {
      toast.error('Error claiming offer');
    }
  };

  const submitReview = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          rideId: currentRide._id,
          revieweeId: currentRide.driverId._id,
          rating,
          comment
        }),
      });
      
      if (response.ok) {
        setShowRatingModal(false);
        setCurrentRide(null);
        setBookingStatus('');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-slate-900 relative overflow-hidden flex flex-col">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <Map 
          center={currentRide?.pickup?.lat ? [currentRide.pickup.lat, currentRide.pickup.lng] : routeDetails?.pickup?.lat ? [routeDetails.pickup.lat, routeDetails.pickup.lng] : [28.6139, 77.2090]} 
          pickup={React.useMemo(() => currentRide?.pickup?.lat ? [currentRide.pickup.lat, currentRide.pickup.lng] : routeDetails?.pickup?.lat ? [routeDetails.pickup.lat, routeDetails.pickup.lng] : null, [currentRide?.pickup, routeDetails?.pickup])}
          dropoff={React.useMemo(() => currentRide?.dropoff?.lat ? [currentRide.dropoff.lat, currentRide.dropoff.lng] : routeDetails?.dropoff?.lat ? [routeDetails.dropoff.lat, routeDetails.dropoff.lng] : null, [currentRide?.dropoff, routeDetails?.dropoff])}
          markers={React.useMemo(() => [
            ...(currentRide ? [
              { position: [currentRide.pickup.lat, currentRide.pickup.lng], popup: 'Pickup' },
              { position: [currentRide.dropoff.lat, currentRide.dropoff.lng], popup: 'Dropoff' }
            ] : [
              ...(routeDetails?.pickup?.lat ? [{ position: [routeDetails.pickup.lat, routeDetails.pickup.lng], popup: 'Pickup' }] : []),
              ...(routeDetails?.dropoff?.lat ? [{ position: [routeDetails.dropoff.lat, routeDetails.dropoff.lng], popup: 'Dropoff' }] : [])
            ]),
            ...(driverLocation ? [{ position: driverLocation, popup: 'Driver', icon: 'car' }] : []),
            ...brands.flatMap(brand => brand.locations.map(loc => ({
              position: [loc.lat, loc.lng],
              popup: brand.name,
              icon: 'brand',
              logo: brand.logo
            })))
          ], [currentRide, routeDetails, driverLocation, brands])}
          onRouteFound={handleRouteFound}
        />
      </div>

      {/* Brand Notification Overlay */}
      <AnimatePresence>
        {showBrandNotification && nearbyBrand && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
          >
            <div className="glass p-6 rounded-[2.5rem] flex flex-col gap-4 shadow-2xl border-indigo-500/30">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white p-3 shadow-inner border border-slate-100">
                  <img src={nearbyBrand.logo} alt={nearbyBrand.name} className="h-full w-full object-contain" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Gift className="h-5 w-5 text-indigo-600" />
                    {nearbyBrand.name} Nearby!
                  </h4>
                  <p className="text-sm font-bold text-slate-600 leading-tight">{nearbyBrand.offerText}</p>
                </div>
                <button 
                  onClick={() => setShowBrandNotification(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <button 
                onClick={() => handleClaimOffer(nearbyBrand._id)}
                className="w-full py-4 accent-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-[1.02] transition-all"
              >
                Claim Reward Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main UI Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-end md:justify-start md:p-8 pointer-events-none">
        <AnimatePresence mode="wait">
          {currentRide && currentRide.status !== 'completed' ? (
            <motion.div 
              key="active-ride"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="glass w-full md:w-[400px] md:rounded-[2.5rem] shadow-2xl pointer-events-auto overflow-hidden border-white/40"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
                      {currentRide.status === 'searching' ? searchingMessage : 
                       currentRide.status === 'accepted' ? 'Driver is on the way' :
                       currentRide.status === 'arrived' ? 'Driver has arrived' : 'On our way'}
                    </h2>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                      {currentRide.status}
                    </p>
                  </div>
                  <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg">
                    <Navigation className="h-6 w-6 animate-pulse" />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-6 flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Clock className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Share with driver</p>
                      <p className="text-2xl font-black text-slate-900 tracking-widest">{currentRide.otp}</p>
                    </div>
                  </div>
                </div>

                {currentRide.driverId && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                          {currentRide.driverId.profilePicture ? (
                            <img src={currentRide.driverId.profilePicture} alt="Driver" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-2xl font-black text-indigo-600">{currentRide.driverId.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{currentRide.driverId.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-black text-slate-600">{currentRide.driverId.rating || '5.0'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">{currentRide.driverId.vehicleNumber}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentRide.driverId.vehicleType}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <div className="h-3 w-3 bg-indigo-600 rounded-full ring-4 ring-indigo-100"></div>
                      <div className="w-0.5 flex-1 bg-slate-100"></div>
                      <div className="h-3 w-3 border-2 border-slate-900 rounded-sm"></div>
                    </div>
                    <div className="flex-1 space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pickup</p>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{currentRide.pickup.address}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dropoff</p>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{currentRide.dropoff.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {currentRide.status === 'started' && (
                  <div className="mt-6 p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 space-y-4">
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      In-Ride Experience
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group">
                        <Music className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        <span className="text-[10px] font-black text-slate-600">Curated Audio</span>
                      </button>
                      <button className="p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group">
                        <QrCode className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        <span className="text-[10px] font-black text-slate-600">QR Rewards</span>
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 text-center italic">Opt-in for exclusive partner offers</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSOS}
                    className="flex-1 py-4 bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    SOS
                  </button>
                  <button
                    onClick={handleShareTrip}
                    className="flex-1 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-slate-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  <button
                    onClick={() => setShowChat(true)}
                    className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </button>
                </div>

                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancel Ride
                </button>
              </div>
            </motion.div>
          ) : !currentRide ? (
            <motion.div 
              key="booking-form"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="glass w-full md:w-[450px] md:rounded-[3rem] shadow-2xl pointer-events-auto flex flex-col max-h-[85vh] md:max-h-[calc(100vh-140px)] overflow-hidden border-white/40"
            >
              <div className="p-10 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Where to?</h2>
                  <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                    <WalletIcon className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-black text-indigo-600">₹{walletBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
                <form onSubmit={handleBook} className="space-y-8">
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                        <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      </div>
                      <input
                        type="text"
                        placeholder="Where from?"
                        value={pickup}
                        onChange={(e) => {
                          setPickup(e.target.value);
                          searchLocation(e.target.value, setPickupSuggestions);
                        }}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-5 pl-14 pr-12 text-slate-900 font-bold transition-all outline-none"
                        required
                      />
                      {pickup && (
                        <button 
                          type="button"
                          onClick={() => {
                            setPickup('');
                            setRouteDetails(prev => ({ ...prev, pickup: null }));
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-all z-10"
                        >
                          <X className="h-4 w-4 text-slate-400" />
                        </button>
                      )}
                      {pickupSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                          {pickupSuggestions.map((loc, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectLocation(loc, 'pickup')}
                              className="w-full px-6 py-4 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors"
                            >
                              {loc.display_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                        <Navigation className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      </div>
                      <input
                        type="text"
                        placeholder="Where to?"
                        value={dropoff}
                        onChange={(e) => {
                          setDropoff(e.target.value);
                          searchLocation(e.target.value, setDropoffSuggestions);
                        }}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-5 pl-14 pr-12 text-slate-900 font-bold transition-all outline-none"
                        required
                      />
                      {dropoff && (
                        <button 
                          type="button"
                          onClick={() => {
                            setDropoff('');
                            setRouteDetails(prev => ({ ...prev, dropoff: null }));
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-all z-10"
                        >
                          <X className="h-4 w-4 text-slate-400" />
                        </button>
                      )}
                      {dropoffSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                          {dropoffSuggestions.map((loc, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectLocation(loc, 'dropoff')}
                              className="w-full px-6 py-4 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors"
                            >
                              {loc.display_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {routeDetails?.distance && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center justify-between p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <TrendingUp className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distance</p>
                          <p className="text-sm font-black text-slate-900">{(routeDetails.distance / 1000).toFixed(1)} km</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Time</p>
                          <p className="text-sm font-black text-slate-900">{Math.round(routeDetails.duration / 60)} mins</p>
                        </div>
                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Clock className="h-5 w-5 text-indigo-600" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Vehicle</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {vehicles.map((vehicle) => {
                        const breakup = fareBreakups[vehicle.id];
                        const eta = vehicle.id === 'bike' ? '2-4' : vehicle.id === 'auto' ? '5-8' : '8-12';
                        
                        return (
                          <div
                            key={vehicle.id}
                            onClick={() => setSelectedVehicle(vehicle.id)}
                            className={`flex items-center justify-between p-5 rounded-[2rem] cursor-pointer transition-all border-2 ${
                              selectedVehicle === vehicle.id
                                ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100'
                                : 'border-transparent bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-5">
                              <div className={`p-4 rounded-2xl transition-all ${selectedVehicle === vehicle.id ? 'accent-gradient text-white shadow-lg' : 'bg-white text-slate-600 shadow-sm'}`}>
                                <vehicle.icon className="h-7 w-7" />
                              </div>
                              <div>
                                <p className="font-black text-slate-900">{vehicle.name}</p>
                                <p className="text-xs font-bold text-slate-500">{eta} mins away</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-xl text-slate-900">₹{calculatedFares[vehicle.id] || '--'}</p>
                              {breakup?.discount > 0 && (
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center justify-end gap-1">
                                  <Gift className="h-3 w-3" />
                                  Sponsored
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {calculatedFares[selectedVehicle] > walletBalance && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3"
                      >
                        <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <AlertCircle className="h-4 w-4 text-rose-500" />
                        </div>
                        <p className="text-xs font-bold text-rose-600">Insufficient balance. Please top up.</p>
                      </motion.div>
                    )}

                    {selectedVehicle && calculatedFares[selectedVehicle] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3"
                      >
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Base Fare</span>
                          <span>₹{fareBreakups[selectedVehicle]?.base || 50}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Distance & Time</span>
                          <span>₹{(fareBreakups[selectedVehicle]?.distanceFare || 0) + (fareBreakups[selectedVehicle]?.timeFare || 0)}</span>
                        </div>
                        {fareBreakups[selectedVehicle]?.discount > 0 && (
                          <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            <span>Sponsored by {fareBreakups[selectedVehicle]?.sponsoredBy}</span>
                            <span>-₹{fareBreakups[selectedVehicle]?.discount}</span>
                          </div>
                        )}
                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Total Price</span>
                          <span className="text-xl font-black text-indigo-600">₹{calculatedFares[selectedVehicle]}</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedVehicle || calculatedFares[selectedVehicle] > walletBalance || bookingStatus}
                    className="w-full py-6 accent-gradient text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all"
                  >
                    {bookingStatus || 'Confirm Booking'}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Cancel Ride?"
        maxWidth="max-w-md"
      >
        <div className="text-center">
          <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <X className="h-10 w-10 text-rose-500" />
          </div>
          <p className="text-slate-500 font-bold mb-10 leading-relaxed">
            Are you sure? Your driver is already on the way.
          </p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleCancelRide}
              className="w-full py-5 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-200 uppercase tracking-widest"
            >
              Yes, Cancel
            </button>
            <button 
              onClick={() => setShowCancelConfirm(false)}
              className="w-full py-5 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest"
            >
              No, Keep
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title="Arrived!"
        maxWidth="max-w-md"
      >
        <div className="text-center">
          <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
          </div>
          <p className="text-slate-500 font-bold mb-10">
            How was your trip with {lastRide?.driverId?.name || 'your driver'}?
          </p>
          
          <div className="flex justify-center gap-3 mb-10">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                onClick={() => setRating(star)}
                className={`h-12 w-12 cursor-pointer transition-all ${star <= rating ? 'text-amber-400 fill-amber-400 scale-110' : 'text-slate-100'}`}
              />
            ))}
          </div>

          <textarea
            className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold mb-10 resize-none"
            placeholder="Any feedback for the driver?"
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>

          <button 
            onClick={submitReview}
            className="w-full py-6 accent-gradient text-white font-black rounded-[2rem] hover:scale-[1.02] transition-all shadow-2xl shadow-indigo-200 uppercase tracking-widest"
          >
            Complete Review
          </button>
        </div>
      </Modal>
      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 md:p-8 pointer-events-none"
          >
            <div className="glass w-full max-w-lg h-[80vh] md:h-[600px] rounded-[2.5rem] shadow-2xl pointer-events-auto flex flex-col overflow-hidden border-white/40">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                    {currentRide?.driverId?.profilePicture ? (
                      <img src={currentRide.driverId.profilePicture} alt="Driver" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-indigo-600">{currentRide?.driverId?.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{currentRide?.driverId?.name}</h3>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Driver</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChat(false)}
                  className="p-3 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4">
                      <MessageSquare className="h-8 w-8 text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">No messages yet. Say hi to your driver!</p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-bold shadow-sm ${
                        msg.type === 'sent' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'
                      }`}>
                        {msg.message}
                        <p className={`text-[8px] mt-1 opacity-60 ${msg.type === 'sent' ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={sendMessage} className="p-6 bg-white/50 border-t border-slate-100">
                <div className="relative group">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full pl-6 pr-14 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && lastRide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReceipt(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
              
              <div className="text-center mb-10">
                <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Trip Receipt</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Thank you for riding with RideDeck</p>
              </div>

              <div className="space-y-6 mb-10">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Base Fare</span>
                  <span className="text-slate-900 font-black">₹{(lastRide.fare * 0.8).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Taxes & Fees</span>
                  <span className="text-slate-900 font-black">₹{(lastRide.fare * 0.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Booking Fee</span>
                  <span className="text-slate-900 font-black">₹{(lastRide.fare * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xl font-black text-slate-900">Total Paid</span>
                  <span className="text-3xl font-black text-indigo-600">₹{lastRide.fare}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 mb-10 border border-slate-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Car className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle</p>
                    <p className="text-sm font-bold text-slate-900 capitalize">{lastRide.vehicleType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Clock className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(lastRide.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowReceipt(false)}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RiderDashboard;
