import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Navigation, Star, Clock, CheckCircle, Shield, Banknote, Power, AlertCircle, Calendar, Zap, Crown, MessageSquare, Send, X, TrendingUp, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Map from '../components/Map';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

const DriverDashboard = () => {
  const { user, login } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [availableRides, setAvailableRides] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const [stats, setStats] = useState({ todayEarnings: 0, totalRides: 0, walletBalance: 0 });
  const [earningsHistory, setEarningsHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ridesRes, activeRideRes, statsRes, earningsHistoryRes] = await Promise.all([
          fetch(`${API_URL}/api/rides/available${currentLocation ? `?lat=${currentLocation.lat}&lng=${currentLocation.lng}` : ''}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          }),
          fetch(`${API_URL}/api/rides/my-ride`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          }),
          fetch(`${API_URL}/api/driver/stats`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          }),
          fetch(`${API_URL}/api/driver/earnings-history`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          })
        ]);

        const ridesData = await ridesRes.json();
        const activeRideData = await activeRideRes.json();
        const statsData = await statsRes.json();
        const earningsHistoryData = await earningsHistoryRes.json();
 
        setAvailableRides(ridesData);
        if (activeRideData) setCurrentRide(activeRideData);
        if (statsRes.ok) setStats(statsData);
        if (earningsHistoryRes.ok) setEarningsHistory(earningsHistoryData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (user)    fetchData();

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('Error getting location:', error)
      );
    }
  }, [user, API_URL, currentLocation?.lat, currentLocation?.lng]);

  useEffect(() => {
    if (!socket) return;

    socket.on('newRideRequest', (ride) => {
      setAvailableRides(prev => [ride, ...prev]);
      toast('New ride request nearby!', { icon: '🚗' });
    });

    socket.on('rideStatusUpdate', (ride) => {
      if (ride.status === 'cancelled') {
        setCurrentRide(null);
        toast.error('Ride was cancelled');
      }
    });

    socket.on('receive-message', (data) => {
      setChatMessages(prev => [...prev, { ...data, type: 'received' }]);
      if (!showChat) toast.success(`New message from ${data.senderName}`);
    });

    return () => {
      socket.off('newRideRequest');
      socket.off('rideStatusUpdate');
      socket.off('receive-message');
    };
  }, [socket, showChat]);

  // Emit location updates when a ride is in progress
  useEffect(() => {
    if (!socket || !currentRide || currentRide.status !== 'started') return;

    const interval = setInterval(() => {
      // Mock location update (moving slightly towards dropoff)
      const location = {
        lat: currentRide.pickup.lat + (Math.random() - 0.5) * 0.001,
        lng: currentRide.pickup.lng + (Math.random() - 0.5) * 0.001
      };
      
      socket.emit('update-location', {
        rideId: currentRide._id,
        driverId: user._id,
        location
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [socket, currentRide, user._id]);

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

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentRide?.riderId) return;

    const messageData = {
      to: currentRide.riderId._id,
      message: chatInput,
      senderName: user.name
    };

    socket.emit('send-message', messageData);
    setChatMessages(prev => [...prev, { ...messageData, type: 'sent', timestamp: new Date() }]);
    setChatInput('');
  };

  const toggleOnline = async () => {
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
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsOnline(!isOnline);
        toast.success(isOnline ? 'You are now offline' : 'You are now online!');
      } else {
        if (data.message && data.message.includes('Subscription')) {
          setShowSubscriptionModal(true);
        }
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAcceptRide = async (rideId) => {
    setLoading(true);
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
        setAvailableRides(prev => prev.filter(r => r._id !== rideId));
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
        if (status === 'completed') toast.success('Ride completed! 100% fare added to your wallet.');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSubscribe = async (type) => {
    try {
      const response = await fetch(`${API_URL}/api/driver/subscribe`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(`Subscribed to ${type} plan!`);
        setShowSubscriptionModal(false);
        // Refresh user data to update subscription status in context
        const userRes = await fetch(`${API_URL}/api/users/profile`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const userData = await userRes.json();
        login({ ...userData, token: user.token });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Subscription failed');
    }
  };

  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch(`${API_URL}/api/brands`);
        const data = await response.json();
        setBrands(data);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };
    fetchBrands();
  }, [API_URL]);

  return (
    <div className="pt-20 min-h-screen bg-slate-900 relative overflow-hidden flex flex-col">
      {/* Map Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <Map 
          center={[28.6139, 77.2090]} 
          markers={[
            ...availableRides.map(ride => ({
              position: [ride.pickup.lat, ride.pickup.lng],
              popup: `Fare: ₹${ride.fare}`
            })),
            ...brands.flatMap(brand => brand.locations.map(loc => ({
              position: [loc.lat, loc.lng],
              popup: `${brand.name} Hotspot`,
              icon: 'brand',
              logo: brand.logo
            })))
          ]}
        />
      </div>

      {/* Main UI */}
      <div className="relative z-10 flex-1 p-6 md:p-10 flex flex-col md:flex-row gap-8">
        {/* Left Panel: Status & Subscription */}
        <div className="w-full md:w-96 space-y-6">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="glass p-8 rounded-[2.5rem] border-white/20"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Status</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {isOnline ? 'Receiving Requests' : 'Currently Offline'}
                </p>
              </div>
              <button 
                onClick={toggleOnline}
                className={`p-4 rounded-2xl transition-all shadow-lg ${isOnline ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-200 text-slate-600'}`}
              >
                <Power className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Crown className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Plan</p>
                    <p className="text-sm font-black text-slate-900 capitalize">{user?.subscriptionType || 'None'}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${user?.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {user?.subscriptionStatus || 'Inactive'}
                </div>
              </div>

              <button 
                onClick={() => setShowSubscriptionModal(true)}
                className="w-full py-4 accent-gradient text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:scale-[1.02] transition-all"
              >
                Manage Subscription
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass p-8 rounded-[2.5rem] border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-500" />
                Earnings
              </h3>
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                <span className="text-xs font-black text-emerald-600">₹{stats.walletBalance.toLocaleString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Today</p>
                <p className="text-xl font-black text-slate-900">₹{stats.todayEarnings.toLocaleString()}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-1">Total Rides</p>
                <p className="text-xl font-black text-slate-900">{stats.totalRides}</p>
              </div>
            </div>
          </motion.div>

          {/* Earnings Analytics */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass p-8 rounded-[2.5rem] border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Weekly Analytics
              </h3>
            </div>
            <div className="flex items-end justify-between gap-2 h-32 px-2">
              {earningsHistory.map((day, i) => {
                const maxAmount = Math.max(...earningsHistory.map(d => d.amount), 1000);
                const height = (day.amount / maxAmount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                      ₹{day.amount}
                    </div>
                    <div 
                      className="w-full bg-indigo-100 rounded-t-lg group-hover:bg-indigo-600 transition-all duration-500"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    ></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase">{day.date}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right Panel: Rides */}
        <div className="flex-1 space-y-6">
          {!isOnline ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass h-full rounded-[3.5rem] border-white/20 flex flex-col items-center justify-center p-12 text-center"
            >
              <div className="h-24 w-24 bg-slate-800 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl">
                <Power className="h-12 w-12 text-slate-500" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4">You're Offline</h3>
              <p className="text-lg font-bold text-slate-500 max-w-md mx-auto mb-10">Go online to start receiving ride requests and earning money.</p>
              <button 
                onClick={toggleOnline}
                className="px-12 py-5 accent-gradient text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:scale-105 transition-all"
              >
                Go Online Now
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {currentRide ? (
                <motion.div 
                  key="active-ride"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="glass p-10 rounded-[3.5rem] border-white/20 shadow-2xl"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-100">
                          Active Ride
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">#{currentRide._id.slice(-6)}</span>
                      </div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                        {currentRide.status === 'accepted' ? 'Pick up Rider' : 'On Trip'}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-black text-indigo-600 tracking-tighter">₹{currentRide.fare}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Fare</p>
                    </div>
                  </div>

                  {/* KYC Verification Banner */}
        {user?.kycStatus !== 'verified' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-6 rounded-[2rem] border flex flex-col md:flex-row items-center justify-between gap-6 ${
              user?.kycStatus === 'pending' 
                ? 'bg-amber-50 border-amber-100' 
                : 'bg-indigo-50 border-indigo-100'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
                user?.kycStatus === 'pending' ? 'bg-amber-100' : 'bg-indigo-100'
              }`}>
                <ShieldCheck className={`h-7 w-7 ${
                  user?.kycStatus === 'pending' ? 'text-amber-600' : 'text-indigo-600'
                }`} />
              </div>
              <div>
                <h3 className={`text-lg font-black ${
                  user?.kycStatus === 'pending' ? 'text-amber-900' : 'text-indigo-900'
                }`}>
                  {user?.kycStatus === 'pending' ? 'Verification in Progress' : 'Complete Your KYC'}
                </h3>
                <p className={`text-sm font-bold ${
                  user?.kycStatus === 'pending' ? 'text-amber-700' : 'text-indigo-700'
                }`}>
                  {user?.kycStatus === 'pending' 
                    ? "We're reviewing your documents. You'll be able to go online once verified." 
                    : 'Verify your documents to start earning with RideDeck.'}
                </p>
              </div>
            </div>
            {user?.kycStatus !== 'pending' && (
              <button
                onClick={() => navigate('/kyc')}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 transition-all whitespace-nowrap"
              >
                Start Verification
              </button>
            )}
          </motion.div>
        )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
                    <div className="space-y-8">
                      <div className="flex gap-6">
                        <div className="flex flex-col items-center gap-2 pt-2">
                          <div className="h-4 w-4 bg-indigo-600 rounded-full ring-4 ring-indigo-100"></div>
                          <div className="w-0.5 flex-1 bg-slate-100 rounded-full"></div>
                          <div className="h-4 w-4 border-2 border-slate-900 rounded-sm"></div>
                        </div>
                        <div className="flex-1 space-y-8">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pickup</p>
                            <p className="text-xl font-bold text-slate-900 leading-tight">{currentRide.pickup.address}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dropoff</p>
                            <p className="text-xl font-bold text-slate-900 leading-tight">{currentRide.dropoff.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col justify-center items-center text-center">
                      <div className="h-20 w-20 bg-white rounded-[1.5rem] flex items-center justify-center text-indigo-600 font-black text-3xl shadow-sm mb-4 border border-slate-100">
                        {currentRide.riderId.name[0]}
                      </div>
                      <h4 className="text-2xl font-black text-slate-900 mb-1">{currentRide.riderId.name}</h4>
                      <div className="flex items-center gap-2 mb-6">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-black text-slate-600">{currentRide.riderId.rating || '5.0'}</span>
                      </div>
                      <div className="flex gap-3 w-full">
                        <button 
                          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${currentRide.status === 'accepted' ? currentRide.pickup.lat + ',' + currentRide.pickup.lng : currentRide.dropoff.lat + ',' + currentRide.dropoff.lng}`, '_blank')}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                        >
                          <Navigation className="h-4 w-4" />
                          Navigate
                        </button>
                        <button 
                          onClick={() => setShowChat(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-all shadow-sm"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Chat
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-10">
                    <button
                      onClick={handleSOS}
                      className="flex-1 py-5 bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <Shield className="h-5 w-5" />
                      SOS Emergency
                    </button>
                  </div>

                  <div className="space-y-6 pt-10 border-t border-slate-100">
                    {currentRide.status === 'accepted' ? (
                      <div className="space-y-6">
                        <div className="max-w-xs mx-auto">
                          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Enter OTP to Start Ride</p>
                          <input 
                            type="text" 
                            maxLength="4"
                            placeholder="0 0 0 0"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.5em] text-slate-900 transition-all outline-none"
                          />
                        </div>
                        <button 
                          onClick={() => updateRideStatus('started')}
                          disabled={otp.length !== 4}
                          className="w-full py-6 accent-gradient text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                        >
                          Start Ride
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => updateRideStatus('completed')}
                        className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-emerald-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Complete Ride
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Available Requests</h2>
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {availableRides.length} Nearby
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {availableRides.length === 0 ? (
                      <div className="glass rounded-[3.5rem] p-20 text-center border-white/20">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Car className="h-10 w-10 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold">Waiting for new requests...</p>
                      </div>
                    ) : (
                      availableRides.map((ride) => (
                        <motion.div 
                          key={ride._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass p-8 rounded-[3rem] border-white/20 shadow-xl hover:shadow-2xl transition-all group"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner">
                                {ride.riderId.name[0]}
                              </div>
                              <div>
                                <h4 className="text-xl font-black text-slate-900">{ride.riderId.name}</h4>
                                <div className="flex items-center gap-2">
                                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                  <span className="text-sm font-black text-slate-500">{ride.riderId.rating || '5.0'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{ride.fare}</p>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">100% Earnings</p>
                            </div>
                          </div>

                          <div className="space-y-6 mb-8">
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center gap-1 pt-1">
                                <div className="h-3 w-3 bg-indigo-600 rounded-full"></div>
                                <div className="w-0.5 flex-1 bg-slate-100"></div>
                                <div className="h-3 w-3 border-2 border-slate-900 rounded-sm"></div>
                              </div>
                              <div className="flex-1 space-y-4">
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pickup</p>
                                  <p className="text-sm font-bold text-slate-900 line-clamp-1">{ride.pickup.address}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Dropoff</p>
                                  <p className="text-sm font-bold text-slate-900 line-clamp-1">{ride.dropoff.address}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleAcceptRide(ride._id)}
                            disabled={loading}
                            className="w-full py-5 accent-gradient text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            Accept Ride
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Subscription Modal */}
      <Modal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        title="Choose Your Plan"
        maxWidth="max-w-4xl"
      >
        <div className="text-center mb-12">
          <p className="text-slate-500 font-bold">Keep 100% of your earnings. No commissions, ever.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { id: 'daily', name: 'Daily', price: '₹49', desc: 'Perfect for part-time' },
            { id: 'weekly', name: 'Weekly', price: '₹299', desc: 'Most popular choice', popular: true },
            { id: 'monthly', name: 'Monthly', price: '₹999', desc: 'Best value for pros' }
          ].map(plan => (
            <div 
              key={plan.id}
              className={`relative p-8 rounded-[2.5rem] border-2 transition-all ${plan.popular ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Popular
                </div>
              )}
              <h3 className="text-xl font-black text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">{plan.desc}</p>
              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900">{plan.price}</span>
              </div>
              <button 
                onClick={() => handleSubscribe(plan.id)}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${plan.popular ? 'accent-gradient text-white shadow-xl shadow-indigo-200' : 'bg-slate-900 text-white'}`}
              >
                Select Plan
              </button>
            </div>
          ))}
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
                    <span className="text-xl font-black text-indigo-600">{currentRide?.riderId?.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{currentRide?.riderId?.name}</h3>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Rider</p>
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
                    <p className="text-sm font-bold text-slate-400">No messages yet. Say hi to your rider!</p>
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
    </div>
  );
};

export default DriverDashboard;
