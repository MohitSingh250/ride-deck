import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Map from '../components/Map';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldCheck, Navigation, CheckCircle, Clock, MapPin, Activity } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import { Circle } from 'react-leaflet';

const DriverDashboard = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [isOnline, setIsOnline] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [otp, setOtp] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(false);

  const earningsData = [
    { day: 'M', amount: 1200 },
    { day: 'T', amount: 1500 },
    { day: 'W', amount: 1000 },
    { day: 'T', amount: 1800 },
    { day: 'F', amount: 2200 },
    { day: 'S', amount: 2500 },
    { day: 'S', amount: 1900 },
  ];

  const heatmapZones = [
    { lat: 28.6139, lng: 77.2090, intensity: 0.8 }, // Connaught Place
    { lat: 28.5355, lng: 77.3910, intensity: 0.6 }, // Noida
    { lat: 28.4595, lng: 77.0266, intensity: 0.9 }, // Gurgaon
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (user) {
      setIsOnline(user.isOnline || false);
    }
  }, [user]);

  useEffect(() => {
    const fetchActiveRide = async () => {
      try {
        const response = await fetch(`${API_URL}/api/rides/my-ride`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await response.json();
        if (data) {
          setActiveRide(data);
          if (data.status === 'completed') setShowRatingModal(true);
        }
      } catch (error) {
        console.error('Error fetching ride:', error);
      }
    };

    if (user) fetchActiveRide();
  }, [user, API_URL]);

  useEffect(() => {
    if (!socket) return;

    socket.on('newRideRequest', (ride) => {
      if (isOnline) {
        setRideRequests(prev => [ride, ...prev]);
      }
    });

    socket.on('rideStatusUpdate', (ride) => {
      setActiveRide(ride);
      if (ride.status === 'completed') setShowRatingModal(true);
      if (ride.status === 'cancelled') setActiveRide(null);
    });

    return () => {
      socket.off('newRideRequest');
      socket.off('rideStatusUpdate');
    };
  }, [socket, isOnline]);

  const toggleStatus = async () => {
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
      if (data.success) {
        setIsOnline(data.isOnline);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleAcceptRide = async (rideId) => {
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
        setActiveRide(data);
        setRideRequests(prev => prev.filter(r => r._id !== rideId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (status === 'started' && otp !== activeRide.otp) {
      alert('Invalid OTP');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/rides/update-status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          rideId: activeRide._id, 
          status,
          otp: status === 'started' ? otp : undefined
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setActiveRide(data);
        if (status === 'completed') setShowRatingModal(true);
      }
    } catch (e) {
      console.error(e);
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
          rideId: activeRide._id,
          revieweeId: activeRide.riderId._id,
          rating,
          comment
        }),
      });
      
      if (response.ok) {
        setShowRatingModal(false);
        setActiveRide(null);
        setOtp('');
        setComment('');
        setRating(5);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-96 bg-white border-r border-gray-100 p-6 space-y-8 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[32px]">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-black rounded-full flex items-center justify-center text-white font-black">
              {user.name[0]}
            </div>
            <div>
              <h3 className="font-black text-black">{user.name}</h3>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold text-gray-600">{user.rating || '5.0'}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={toggleStatus}
            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isOnline ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {isOnline ? 'Online' : 'Offline'}
          </button>
        </div>

        <div className="bg-black rounded-[32px] p-6 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Subscription</p>
            <h4 className="text-2xl font-black mb-4">Daily Plan</h4>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold opacity-80">Active</span>
            </div>
            <button className="w-full py-3 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
              Renew Plan
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-[32px] p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Weekly Earnings</p>
              <h4 className="text-2xl font-black text-black">₹8,240</h4>
            </div>
            <button 
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`p-2 rounded-xl transition-colors ${showHeatmap ? 'bg-orange-100 text-orange-600' : 'bg-white text-gray-400'}`}
              title="Toggle Heatmap"
            >
              <Activity className="h-5 w-5" />
            </button>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsData}>
                <Bar dataKey="amount" fill="#000" radius={[4, 4, 0, 0]} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative bg-gray-100 min-h-[500px]">
        <div className="absolute inset-0 z-0">
          <Map 
            center={activeRide?.pickup?.lat ? [activeRide.pickup.lat, activeRide.pickup.lng] : [28.6139, 77.2090]} 
            pickup={activeRide?.pickup?.lat ? [activeRide.pickup.lat, activeRide.pickup.lng] : null}
            dropoff={activeRide?.dropoff?.lat ? [activeRide.dropoff.lat, activeRide.dropoff.lng] : null}
            markers={activeRide ? [
              { position: [activeRide.pickup.lat, activeRide.pickup.lng], popup: 'Pickup' },
              { position: [activeRide.dropoff.lat, activeRide.dropoff.lng], popup: 'Dropoff' }
            ] : [{ position: [28.6139, 77.2090], popup: 'Current Location' }]}
          >
            {showHeatmap && heatmapZones.map((zone, i) => (
              <Circle 
                key={i}
                center={[zone.lat, zone.lng]}
                pathOptions={{ fillColor: 'red', color: 'red', opacity: 0.1, fillOpacity: zone.intensity * 0.5 }}
                radius={2000}
              />
            ))}
          </Map>
        </div>

        <AnimatePresence>
          {activeRide && activeRide.status !== 'completed' && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute bottom-8 left-8 right-8 md:left-auto md:w-[400px] bg-white rounded-[40px] shadow-2xl z-10 overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-black tracking-tight">Active Trip</h3>
                    <p className="text-sm text-gray-500 font-medium">#{activeRide._id.slice(-6)}</p>
                  </div>
                  <div className="bg-black text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                    {activeRide.status}
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl">
                  <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center font-black text-black">
                    {activeRide.riderId.name[0]}
                  </div>
                  <div>
                    <p className="font-black text-black">{activeRide.riderId.name}</p>
                    <p className="text-xs text-gray-500 font-bold">{activeRide.riderId.phone}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xl font-black text-black">₹{activeRide.fare}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase">Cash</p>
                  </div>
                </div>

                {activeRide.status === 'accepted' && (
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <ShieldCheck className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                      </div>
                      <input
                        type="text"
                        maxLength="4"
                        className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black transition-all font-black tracking-[1em] text-center text-xl"
                        placeholder="ENTER OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => handleUpdateStatus('started')}
                      className="w-full py-5 bg-black text-white font-black rounded-3xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
                    >
                      START TRIP
                    </button>
                  </div>
                )}

                {activeRide.status === 'started' && (
                  <button 
                    onClick={() => handleUpdateStatus('completed')}
                    className="w-full py-5 bg-green-500 text-white font-black rounded-3xl hover:bg-green-600 transition-all shadow-xl shadow-green-100"
                  >
                    COMPLETE TRIP
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!activeRide && isOnline && (
          <div className="absolute top-8 right-8 w-80 space-y-4 z-10">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">New Requests</h3>
            <AnimatePresence>
              {rideRequests.map((ride) => (
                <motion.div
                  key={ride._id}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 50, opacity: 0 }}
                  className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-lg font-black text-black">₹{ride.fare}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase">{ride.vehicleType}</p>
                    </div>
                    <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center">
                      <Navigation className="h-5 w-5 text-black" />
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-black rounded-full"></div>
                      <p className="text-xs font-bold text-gray-600 line-clamp-1">{ride.pickup.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 border border-black rounded-sm"></div>
                      <p className="text-xs font-bold text-gray-600 line-clamp-1">{ride.dropoff.address}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAcceptRide(ride._id)}
                    className="w-full py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all"
                  >
                    Accept Ride
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showRatingModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] p-10 shadow-2xl max-w-md w-full text-center"
            >
              <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-3xl font-black text-black mb-2">Trip Completed!</h3>
              <p className="text-gray-500 font-medium mb-8">How was your experience with {activeRide?.riderId?.name}?</p>
              
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    onClick={() => setRating(star)}
                    className={`h-10 w-10 cursor-pointer transition-all ${star <= rating ? 'text-yellow-500 fill-yellow-500 scale-110' : 'text-gray-200'}`}
                  />
                ))}
              </div>

              <textarea
                className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black transition-all font-medium mb-8 resize-none"
                placeholder="Leave a comment (optional)"
                rows="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              ></textarea>

              <button 
                onClick={submitReview}
                className="w-full py-5 bg-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all shadow-xl"
              >
                SUBMIT REVIEW
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverDashboard;
