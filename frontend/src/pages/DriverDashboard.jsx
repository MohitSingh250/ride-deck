import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Navigation, Star, Clock, CheckCircle, Shield, Banknote, Power, AlertCircle, Calendar, Zap, Crown, MessageSquare, Send, X, TrendingUp, ShieldCheck, ChevronRight, Phone, User, LogOut, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Map from '../components/Map';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const DriverDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { socket, isOnline, setIsOnline } = useSocket();
  const navigate = useNavigate();
  const [availableRides, setAvailableRides] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingActiveRide, setFetchingActiveRide] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [lastCompletedRide, setLastCompletedRide] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmitRating = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rides/${lastCompletedRide._id}/rate`, {
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
        setRating(0);
        setReview('');
      } else {
        toast.error('Failed to submit rating');
      }
    } catch (error) {
      toast.error('Error submitting rating');
    }
  };

  const [stats, setStats] = useState({ todayEarnings: 0, totalRides: 0, walletBalance: 0 });
  const [earningsHistory, setEarningsHistory] = useState([]);
  const [recentRides, setRecentRides] = useState([]);
  const lastFetchToken = useRef(null);
  const lastActiveRideToken = useRef(null);
  const lastActivityToken = useRef(null);


  useEffect(() => {
    const fetchRecentRides = async () => {
      if (!user?.token || lastActivityToken.current === user.token) return;
      lastActivityToken.current = user.token;
      try {
        const res = await fetch(`${API_URL}/api/rides/history?limit=3`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (res.ok) setRecentRides(data.rides || []);
      } catch (error) {
        console.error('Error fetching recent rides:', error);
      }
    };
    fetchRecentRides();
  }, [user?.token]);


  useEffect(() => {
    if (user) {
      setIsOnline(!!user.isOnline);
    }
  }, [user?.isOnline]);


  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.token || lastFetchToken.current === user.token) return;
      lastFetchToken.current = user.token;

      
      try {
        const [statsRes, earningsHistoryRes] = await Promise.all([
          fetch(`${API_URL}/api/driver/stats`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          }),
          fetch(`${API_URL}/api/driver/earnings-history`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (earningsHistoryRes.ok) setEarningsHistory(await earningsHistoryRes.json());
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [user?.token]);


  const fetchAvailableRides = async () => {
    if (!user?.token || !currentLocation) return;
    try {
      const res = await fetch(`${API_URL}/api/rides/available?lat=${currentLocation.lat}&lng=${currentLocation.lng}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAvailableRides(data);
      }
    } catch (error) {
      console.error('Error fetching available rides:', error);
    }
  };

  useEffect(() => {
    if (isOnline && currentLocation) {
      fetchAvailableRides();
    } else if (!isOnline) {
      setAvailableRides([]);
    }
  }, [isOnline, currentLocation]);

  useEffect(() => {
    const fetchActiveRide = async () => {
      if (!user?.token || lastActiveRideToken.current === user.token) return;
      lastActiveRideToken.current = user.token;


      setFetchingActiveRide(true);
      try {
        const res = await fetch(`${API_URL}/api/rides/my-ride`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (data) setCurrentRide(data);
      } catch (error) {
        console.error('Error fetching active ride:', error);
      } finally {
        setFetchingActiveRide(false);
      }
    };

    fetchActiveRide();
  }, [user?.token]);


  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);


          if (isOnline && socket) {
            socket.emit('update-location', {
              rideId: currentRide?._id || null,
              location: newLocation,
              driverId: user._id
            });
          }
        },
        (error) => {
          // Silence common dev errors (Timeout/Unavailable) to keep console clean
          if (error.code !== 3 && error.code !== 2) {
             console.error('Geolocation error:', error.message);
          }
          
          // Fallback to a default location (e.g., Delhi) so the app doesn't break
          const fallbackLocation = { lat: 28.6139, lng: 77.2090 };
          setCurrentLocation(fallbackLocation);
          
          if (isOnline && socket) {
            socket.emit('update-location', {
              rideId: currentRide?._id || null,
              location: fallbackLocation,
              driverId: user._id
            });
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [currentRide, socket, user?._id]);

  useEffect(() => {
    if (!socket) return;

    socket.on('newRideRequest', (ride) => {
      setAvailableRides(prev => {
        if (prev.find(r => r._id === ride._id)) return prev;
        return [ride, ...prev];
      });
      toast('New ride request nearby!', { icon: '🚗' });
    });

    socket.on('rideStatusUpdate', (ride) => {
      if (ride.status === 'cancelled') {
        setCurrentRide(null);
        setOtp('');

        setCancellationModalOpen(true);
      }
    });

    socket.on('receive-message', (data) => {
      setChatMessages(prev => [...prev, { ...data, type: 'received' }]);
      if (!showChat) toast.success(`New message from ${data.senderName}`);
    });

    socket.on('kyc-status-update', (data) => {
      if (data.status === 'verified') {
        toast.success(data.message);
        updateUser({ kycStatus: 'verified', isVerified: true });
      } else if (data.status === 'rejected') {
        toast.error(data.message);
        updateUser({ kycStatus: 'rejected', isVerified: false });
      }
    });

    return () => {
      socket.off('newRideRequest');
      socket.off('rideStatusUpdate');
      socket.off('receive-message');
      socket.off('kyc-status-update');
    };
  }, [socket, showChat]);

  const handleToggleOnline = async () => {
    if (user.kycStatus !== 'verified') {
      toast.error('Please complete your KYC verification to go online');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/driver/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          isOnline: !isOnline,
          lat: currentLocation?.lat,
          lng: currentLocation?.lng
        })
      });
      const data = await response.json();
      if (data.success) {
        setIsOnline(data.isOnline);
        if (data.isOnline) {
          socket.emit('driver-online', user._id);
          toast.success('You are now Online');
        } else {
          toast.success('You are now Offline');
        }
      } else {
        if (data.message && data.message.includes('Subscription')) {
          setShowSubscriptionModal(true);
        }
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAcceptRide = async (rideId) => {
    setLoading(true);

    setAvailableRides(prev => prev.filter(r => r._id !== rideId));
    
    try {
      const response = await fetch(`${API_URL}/api/rides/accept`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ rideId }),
      });

      const data = await response.json();
      if (response.ok) {
        setCurrentRide(data);
        toast.success('Ride accepted!');
      } else {

        toast.error(data.message);

      }
    } catch (error) {
      toast.error('Failed to accept ride');
    } finally {
      setLoading(false);
    }
  };

  const updateRideStatus = async (status) => {
    try {
      const response = await fetch(`${API_URL}/api/rides/update-status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ rideId: currentRide._id, status, otp }),
      });

      const data = await response.json();
      if (response.ok) {
        setCurrentRide(status === 'completed' ? null : data);
        if (status === 'completed') {
          setLastCompletedRide(data);
          setShowSummary(true);
          setShowRatingModal(true);
          toast.success('Ride completed!');
        } else {

        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };
  const handleSOS = async () => {
    if (!currentRide) return;
    try {
      const response = await fetch(`${API_URL}/api/rides/sos`, {
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

  const handleNavigate = () => {
    if (!currentRide) return;
    const dest = currentRide.status === 'accepted' ? currentRide.pickup : currentRide.dropoff;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`;
    window.open(url, '_blank');
  };

  if (fetchingActiveRide) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-bold">Restoring session...</p>
        </div>
      </div>
    );
  }

  const handleSubscribe = async (planType) => {
    try {
      const response = await fetch(`${API_URL}/api/driver/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ type: planType })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setShowSubscriptionModal(false);

        updateUser(data.user);
      } else {
        toast.error(data.message || 'Subscription failed');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden pt-16 relative">
      {/* Left Sidebar: Status & Stats */}
      <div className="fixed bottom-0 left-0 right-0 h-[45vh] lg:h-full lg:w-[400px] lg:relative lg:bottom-auto bg-white border-t lg:border-t-0 lg:border-r border-zinc-100 flex flex-col z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-xl rounded-t-3xl lg:rounded-none">
        <div className="p-6 flex-1 overflow-y-auto space-y-8">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">{isOnline ? 'Online' : 'Offline'}</h1>
              <p className="text-sm text-zinc-500">{isOnline ? 'You are receiving requests' : 'Go online to start earning'}</p>
            </div>
            <button 
              onClick={handleToggleOnline}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${isOnline ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-zinc-100 text-zinc-400'}`}
            >
              <Power className="h-8 w-8" />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Today</p>
              <p className="text-2xl font-bold text-black">₹{stats.todayEarnings}</p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Rides</p>
              <p className="text-2xl font-bold text-black">{stats.totalRides}</p>
            </div>
          </div>

          {/* Wallet Card */}
          <div className="p-6 bg-black rounded-2xl text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Banknote className="h-24 w-24" />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Wallet Balance</p>
              <h3 className="text-4xl font-bold mb-6">₹{stats.walletBalance}</h3>
              <button className="text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all">
                Withdraw funds <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Plan</p>
                <p className="font-bold text-black capitalize">{user?.subscriptionType || 'Free Tier'}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowSubscriptionModal(true)}
              className="text-sm font-bold text-black hover:underline"
            >
              Manage
            </button>
          </div>

          {/* Performance Chart (Simplified) */}
          <div className="space-y-4">
            <h3 className="font-bold text-black flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-zinc-400" /> Performance
            </h3>
            <div className="flex items-end justify-between gap-2 h-24 px-2">
              {earningsHistory.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div 
                    className="w-full bg-zinc-100 rounded-full group-hover:bg-black transition-all"
                    style={{ height: `${(day.amount / Math.max(...earningsHistory.map(d => d.amount), 100)) * 100}%` }}
                  />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{day.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4 pt-4 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-black flex items-center gap-2">
                <Clock className="h-5 w-5 text-zinc-400" /> Recent Activity
              </h3>
              <button onClick={() => navigate('/history')} className="text-xs font-bold text-zinc-400 hover:text-black transition-all">View All</button>
            </div>
            <div className="space-y-3">
              {recentRides.length === 0 ? (
                <p className="text-xs text-zinc-400 py-2">No recent rides found.</p>
              ) : (
                recentRides.map((ride) => (
                  <div key={ride._id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between group hover:border-black transition-all cursor-pointer" onClick={() => navigate('/history')}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <MapPin className="h-4 w-4 text-black" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-black line-clamp-1">{ride.dropoff.address}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase">{new Date(ride.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-black">₹{ride.fare}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Profile Bar */}
        <div className="p-6 border-t border-zinc-100 bg-zinc-50">
          <button 
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-4 hover:bg-zinc-100 p-2 rounded-2xl transition-all text-left"
          >
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-bold">
              {user?.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-bold text-black">{user?.name}</p>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                <span className="text-xs font-bold">4.9</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-zinc-300" />
          </button>
        </div>
      </div>

      {/* Right Side: Map & Requests */}
      <div className="flex-1 relative h-full bg-zinc-100">
        <Map 
          center={currentLocation ? [currentLocation.lat, currentLocation.lng] : [28.6139, 77.2090]}
          markers={availableRides.map(ride => ({
            position: [ride.pickup.lat, ride.pickup.lng],
            popup: `Fare: ₹${ride.fare}`
          }))}
        />

        {/* Active Ride Overlay */}
        <AnimatePresence>
          {currentRide && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-white rounded-3xl shadow-2xl p-8 border border-zinc-100 z-30"
            >
              {/* KYC Banner */}
      {user?.kycStatus !== 'verified' && (
        <div className="bg-amber-50 border-b border-amber-100 p-4 -mx-8 -mt-8 mb-4 rounded-t-3xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 font-medium">
                {user?.kycStatus === 'pending' 
                  ? 'Your KYC is under review. You will be notified once verified.' 
                  : 'Complete your KYC verification to start accepting rides.'}
              </p>
            </div>
            {user?.kycStatus === 'none' && (
              <button 
                onClick={() => navigate('/kyc')}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold text-sm hover:bg-amber-600 transition-all"
              >
                Complete KYC
              </button>
            )}
          </div>
        </div>
      )}

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-full">Active Ride</span>
                    <span className="text-xs text-zinc-400 font-bold">#{currentRide._id.slice(-6)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-bold text-black">
                      {currentRide.status === 'accepted' ? 'Pick up Rider' : 'On Trip'}
                    </h2>
                    <button 
                      onClick={handleNavigate}
                      className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-all"
                      title="Navigate"
                    >
                      <Navigation className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-black">₹{currentRide.fare}</p>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Estimated Fare</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <div className="w-2 h-2 bg-black rounded-full" />
                      <div className="w-[1px] flex-1 bg-zinc-200" />
                      <div className="w-2 h-2 border border-black rounded-sm" />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pickup</p>
                        <p className="text-sm font-bold text-black line-clamp-1">{currentRide.pickup.address}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Dropoff</p>
                        <p className="text-sm font-bold text-black line-clamp-1">{currentRide.dropoff.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black font-bold shadow-sm">
                      {currentRide.riderId?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-black">{currentRide.riderId?.name || 'Unknown Rider'}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                        <span className="text-xs font-bold">{currentRide.riderId?.rating || '5.0'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3 bg-white rounded-full shadow-sm hover:bg-zinc-100 transition-all">
                      <Phone className="h-5 w-5 text-black" />
                    </button>
                    <button onClick={() => setShowChat(true)} className="p-3 bg-white rounded-full shadow-sm hover:bg-zinc-100 transition-all">
                      <MessageSquare className="h-5 w-5 text-black" />
                    </button>
                  </div>
                </div>
              </div>

                <div className="flex gap-4">
                  {currentRide.status === 'accepted' ? (
                    <button 
                      onClick={() => updateRideStatus('arrived')}
                      className="uber-btn-black flex-1 py-4 text-lg"
                    >
                      I have Arrived
                    </button>
                  ) : currentRide.status === 'arrived' ? (
                    <div className="flex-1 flex gap-4">
                      <input 
                        type="text" 
                        maxLength="4"
                        placeholder="OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-32 px-4 py-4 bg-zinc-100 rounded-xl text-center text-2xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-black"
                      />
                      <button 
                        onClick={() => updateRideStatus('started')}
                        disabled={otp.length !== 4}
                        className="uber-btn-black flex-1 py-4 text-lg disabled:opacity-50"
                      >
                        Start Ride
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => updateRideStatus('completed')}
                      className="uber-btn-black flex-1 py-4 text-lg bg-emerald-600 hover:bg-emerald-700"
                    >
                      Complete Ride
                    </button>
                  )}
                  <button onClick={handleSOS} className="p-4 bg-zinc-100 text-rose-500 rounded-xl hover:bg-rose-50 transition-all">
                    <Shield className="h-6 w-6" />
                  </button>
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Available Requests List */}
        {!currentRide && isOnline && (
          <div className="absolute top-4 left-4 right-4 md:left-auto md:top-8 md:right-8 md:w-full md:max-w-sm space-y-4 z-30">
            <AnimatePresence>
              {availableRides.map((ride) => (
                <motion.div
                  key={ride._id}
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  className="bg-white p-6 rounded-2xl shadow-2xl border border-zinc-100 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold">
                        {ride.riderId?.name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-black">{ride.riderId?.name || 'Unknown Rider'}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                          <span className="text-xs font-bold">{ride.riderId?.rating || '5.0'}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-black">₹{ride.fare}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pickup</p>
                    <p className="text-sm font-bold text-black line-clamp-1">{ride.pickup.address}</p>
                  </div>
                  <button 
                    onClick={() => handleAcceptRide(ride._id)}
                    className="uber-btn-black w-full py-3"
                  >
                    Accept Request
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {availableRides.length === 0 && (
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 text-center">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-zinc-400 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-zinc-500">Waiting for requests...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      <Modal isOpen={cancellationModalOpen} onClose={() => setCancellationModalOpen(false)} title="Ride Cancelled">
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
            <X className="h-8 w-8 text-rose-500" />
          </div>
          <h3 className="text-xl font-bold">Rider Cancelled</h3>
          <p className="text-zinc-500">The rider has cancelled the trip. You are now available for new requests.</p>
          <button 
            onClick={() => setCancellationModalOpen(false)}
            className="uber-btn-black w-full py-3"
          >
            Got it
          </button>
        </div>
      </Modal>

      {/* Subscription Modal */}
      <Modal isOpen={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} title="Driver Plans">
        <div className="grid md:grid-cols-3 gap-6 p-4">
          {[
            { id: 'daily', name: 'Daily', price: '49', icon: Clock },
            { id: 'weekly', name: 'Weekly', price: '299', icon: Zap, popular: true },
            { id: 'monthly', name: 'Monthly', price: '999', icon: Crown }
          ].map(plan => (
            <div key={plan.id} className={`p-6 rounded-2xl border-2 transition-all flex flex-col ${plan.popular ? 'border-black bg-zinc-50' : 'border-zinc-100'}`}>
              <plan.icon className="h-8 w-8 mb-4 text-black" />
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-3xl font-bold mb-6">₹{plan.price}</p>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> 0% Commission</li>
                <li className="text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Priority Matching</li>
              </ul>
              <button 
                onClick={() => handleSubscribe(plan.id)}
                className="uber-btn-black w-full py-3 text-sm"
              >
                Activate
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Chat Overlay */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-lg h-[600px] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold">
                    {currentRide?.riderId.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-black">{currentRide?.riderId.name}</h3>
                    <p className="text-xs text-zinc-400">Rider</p>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                  <X className="h-6 w-6 text-black" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${msg.type === 'sent' ? 'bg-black text-white rounded-tr-none' : 'bg-white text-black rounded-tl-none shadow-sm'}`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-zinc-100">
                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full pl-6 pr-14 py-4 bg-zinc-100 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black"
                  />
                  <button 
                    onClick={() => {
                      if (!chatInput.trim()) return;
                      const msgData = {
                        rideId: currentRide._id,
                        senderId: user._id,
                        senderName: user.name,
                        message: chatInput,
                        receiverId: currentRide.riderId._id
                      };
                      socket.emit('send-message', msgData);
                      setChatMessages(prev => [...prev, { ...msgData, type: 'sent' }]);
                      setChatInput('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black text-white rounded-lg shadow-lg"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Rating Modal */}
      <Modal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} title="Rate Rider">
        <div className="p-6 text-center space-y-6">
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            {lastCompletedRide?.riderId?.name?.[0]}
          </div>
          <div>
            <h3 className="text-xl font-bold">{lastCompletedRide?.riderId?.name}</h3>
            <p className="text-zinc-500">How was the rider?</p>
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

    </div>
  );
};

export default DriverDashboard;
