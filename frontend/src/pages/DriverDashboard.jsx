import React, { useState, useEffect } from 'react';
import { Car, MapPin, Navigation, Star, Clock, CheckCircle, Shield, Banknote, Power, AlertCircle, Calendar, Zap, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Map from '../components/Map';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

const DriverDashboard = () => {
  const { user, login } = useAuth();
  const socket = useSocket();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [availableRides, setAvailableRides] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ridesRes, activeRideRes] = await Promise.all([
          fetch(`${API_URL}/api/rides/available`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          }),
          fetch(`${API_URL}/api/rides/my-ride`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          })
        ]);

        const ridesData = await ridesRes.json();
        const activeRideData = await activeRideRes.json();

        setAvailableRides(ridesData);
        if (activeRideData) setCurrentRide(activeRideData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (user) fetchData();
  }, [user, API_URL]);

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

    return () => {
      socket.off('newRideRequest');
      socket.off('rideStatusUpdate');
    };
  }, [socket]);

  const toggleOnline = async () => {
    try {
      const response = await fetch(`${API_URL}/api/driver/status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ isOnline: !isOnline }),
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

  return (
    <div className="pt-20 min-h-screen bg-slate-900 relative overflow-hidden flex flex-col">
      {/* Map Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <Map 
          center={[28.6139, 77.2090]} 
          markers={availableRides.map(ride => ({
            position: [ride.pickup.lat, ride.pickup.lng],
            popup: `Fare: ₹${ride.fare}`
          }))}
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
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Banknote className="h-5 w-5 text-emerald-500" />
              Earnings (100%)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Today</p>
                <p className="text-xl font-black text-slate-900">₹1,240</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-1">Weekly</p>
                <p className="text-xl font-black text-slate-900">₹8,450</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Panel: Rides */}
        <div className="flex-1 space-y-6">
          <AnimatePresence mode="wait">
            {currentRide ? (
              <motion.div 
                key="active-ride"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="glass p-10 rounded-[3rem] border-white/20 shadow-2xl"
              >
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Active Ride</h2>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{currentRide.status}</p>
                  </div>
                  <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xl">
                    ₹{currentRide.fare}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <div className="h-3 w-3 bg-indigo-600 rounded-full ring-4 ring-indigo-100"></div>
                        <div className="w-0.5 h-12 bg-slate-100"></div>
                        <div className="h-3 w-3 border-2 border-slate-900 rounded-sm"></div>
                      </div>
                      <div className="flex-1 space-y-6">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pickup</p>
                          <p className="text-sm font-bold text-slate-900">{currentRide.pickup.address}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dropoff</p>
                          <p className="text-sm font-bold text-slate-900">{currentRide.dropoff.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                        <Star className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rider</p>
                        <p className="text-lg font-black text-slate-900">{currentRide.riderId.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center space-y-6">
                    {currentRide.status === 'accepted' && (
                      <div className="space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Enter OTP to Start</p>
                        <input 
                          type="text" 
                          maxLength="4"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full py-6 text-center text-4xl font-black tracking-[1em] bg-slate-50 border-2 border-transparent rounded-[2rem] focus:border-indigo-600 transition-all"
                          placeholder="0000"
                        />
                        <button 
                          onClick={() => updateRideStatus('started')}
                          className="w-full py-6 accent-gradient text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-200"
                        >
                          Start Ride
                        </button>
                      </div>
                    )}
                    {currentRide.status === 'started' && (
                      <button 
                        onClick={() => updateRideStatus('completed')}
                        className="w-full py-8 bg-emerald-500 text-white rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all"
                      >
                        Complete Ride
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="ride-list"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black text-white tracking-tight">Available Rides</h2>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold uppercase tracking-widest">Live</span>
                  </div>
                </div>

                {availableRides.length === 0 ? (
                  <div className="glass p-20 rounded-[3rem] text-center border-white/10">
                    <div className="h-20 w-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Zap className="h-10 w-10 text-slate-600" />
                    </div>
                    <p className="text-slate-400 font-bold">Waiting for ride requests...</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {availableRides.map(ride => (
                      <motion.div 
                        layout
                        key={ride._id}
                        className="glass p-6 rounded-[2rem] border-white/20 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-indigo-500/50 transition-all group"
                      >
                        <div className="flex-1 flex gap-6">
                          <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:accent-gradient group-hover:text-white transition-all">
                            <MapPin className="h-8 w-8" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xl font-black text-slate-900">₹{ride.fare}</span>
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-black text-slate-500 uppercase">{ride.vehicleType}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-600 line-clamp-1">{ride.pickup.address}</p>
                            <p className="text-xs font-medium text-slate-400">To: {ride.dropoff.address}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleAcceptRide(ride._id)}
                          disabled={loading}
                          className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:accent-gradient transition-all shadow-lg"
                        >
                          Accept
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
    </div>
  );
};

export default DriverDashboard;
