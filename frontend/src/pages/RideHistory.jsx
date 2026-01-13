import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Navigation, ChevronRight, Calendar, CreditCard } from 'lucide-react';

const RideHistory = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/api/rides/history`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await response.json();
        setRides(data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchHistory();
  }, [user, API_URL]);

  return (
    <div className="pt-32 min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">Ride History</h1>
            <p className="text-lg font-bold text-slate-400">Your journey through the city, chronicled.</p>
          </div>
          <div className="glass px-6 py-3 rounded-2xl shadow-xl border-white/40 flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-lg font-black text-slate-900">{rides.length} Total Trips</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-56 bg-white/50 rounded-[3rem] animate-pulse border border-white/60"></div>
            ))}
          </div>
        ) : rides.length > 0 ? (
          <div className="space-y-12 relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-slate-200 to-transparent hidden md:block"></div>

            {rides.map((ride, index) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                key={ride._id}
                className="relative flex flex-col md:flex-row gap-10 group"
              >
                {/* Timeline Dot */}
                <div className="absolute left-8 top-12 w-5 h-5 bg-white rounded-full border-4 border-indigo-600 shadow-xl transform -translate-x-1/2 z-10 hidden md:block group-hover:scale-125 transition-transform duration-300"></div>

                {/* Date/Time (Left side on desktop) */}
                <div className="md:w-32 md:text-right pt-10 pl-12 md:pl-0">
                  <p className="font-black text-slate-900 text-xl">{new Date(ride.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                  <p className="text-sm text-slate-400 font-black uppercase tracking-widest">{new Date(ride.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                {/* Card */}
                <div className="flex-1 glass rounded-[3.5rem] p-8 shadow-2xl border-white/40 hover:shadow-indigo-100/50 transition-all duration-500 group-hover:-translate-y-1">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                        ride.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        ride.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                        'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      }`}>
                        {ride.status}
                      </div>
                      <span className="text-xs font-black text-slate-300 tracking-widest">ID: {ride._id.slice(-6).toUpperCase()}</span>
                    </div>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter">₹{ride.fare}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="flex gap-5">
                        <div className="flex flex-col items-center gap-2 pt-1.5">
                          <div className="h-3 w-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-100"></div>
                          <div className="w-0.5 flex-1 bg-slate-100 rounded-full"></div>
                          <div className="h-3 w-3 border-2 border-indigo-600 rounded-sm"></div>
                        </div>
                        <div className="flex-1 space-y-6">
                          <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Pickup</p>
                            <p className="text-base font-bold text-slate-700 line-clamp-2 leading-tight">{ride.pickup.address}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Dropoff</p>
                            <p className="text-base font-bold text-slate-700 line-clamp-2 leading-tight">{ride.dropoff.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end gap-6">
                      <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100 w-full sm:w-auto">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">
                            {user.role === 'rider' ? 'Driver' : 'Rider'}
                          </p>
                          <p className="font-black text-slate-900">
                            {user.role === 'rider' ? ride.driverId?.name : ride.riderId?.name}
                          </p>
                        </div>
                        <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-xl">
                          {(user.role === 'rider' ? ride.driverId?.name?.[0] : ride.riderId?.name?.[0]) || '?'}
                        </div>
                      </div>
                      <button className="p-5 bg-white rounded-2xl shadow-lg border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-200 transition-all duration-300">
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-[4rem] p-24 text-center border-white/40 shadow-2xl">
            <div className="h-24 w-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Clock className="h-12 w-12 text-indigo-300" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-3">No journeys yet</h3>
            <p className="text-lg font-bold text-slate-400 mb-10 max-w-md mx-auto">Your past trips will appear here once you've completed your first ride.</p>
            <button 
              onClick={() => navigate(user.role === 'driver' ? '/driver-dashboard' : '/rider-dashboard')}
              className="accent-gradient text-white px-12 py-5 rounded-2xl font-black hover:scale-105 transition-all shadow-2xl shadow-indigo-100 uppercase tracking-widest"
            >
              {user.role === 'driver' ? 'Go to Dashboard' : 'Book your first ride'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RideHistory;
