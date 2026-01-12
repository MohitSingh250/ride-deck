import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Navigation, ChevronRight, Calendar, CreditCard } from 'lucide-react';

const RideHistory = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
    <div className="pt-24 min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-black tracking-tight">Ride History</h1>
            <p className="text-gray-500 font-medium">View your past trips and details</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-sm font-black text-black">{rides.length} Trips</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-white rounded-[32px] animate-pulse"></div>
            ))}
          </div>
        ) : rides.length > 0 ? (
          <div className="space-y-6">
            {rides.map((ride, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={ride._id}
                className="relative flex flex-col md:flex-row gap-6 md:gap-12 group"
              >
                {/* Timeline Dot */}
                <div className="absolute left-8 top-8 w-4 h-4 bg-black rounded-full border-4 border-white shadow-md transform -translate-x-1/2 z-10 hidden md:block group-hover:scale-125 transition-transform"></div>

                {/* Date/Time (Left side on desktop) */}
                <div className="md:w-32 md:text-right pt-6 md:pt-6 pl-12 md:pl-0">
                  <p className="font-black text-black text-lg">{new Date(ride.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                  <p className="text-sm text-gray-400 font-bold">{new Date(ride.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                {/* Card */}
                <div className="flex-1 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        ride.status === 'completed' ? 'bg-green-50 text-green-600' :
                        ride.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {ride.status}
                      </div>
                      <span className="text-xs font-bold text-gray-400">#{ride._id.slice(-6)}</span>
                    </div>
                    <p className="text-2xl font-black text-black">₹{ride.fare}</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <div className="h-2 w-2 bg-black rounded-full"></div>
                        <div className="w-0.5 flex-1 bg-gray-100"></div>
                        <div className="h-2 w-2 border-2 border-black rounded-sm"></div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Pickup</p>
                          <p className="text-sm font-bold text-black line-clamp-1">{ride.pickup.address}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Dropoff</p>
                          <p className="text-sm font-bold text-black line-clamp-1">{ride.dropoff.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-1 flex flex-col justify-center items-end">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                          {user.role === 'rider' ? 'Driver' : 'Rider'}
                        </p>
                        <p className="font-bold text-black">
                          {user.role === 'rider' ? ride.driverId?.name : ride.riderId?.name}
                        </p>
                      </div>
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                        {(user.role === 'rider' ? ride.driverId?.name?.[0] : ride.riderId?.name?.[0]) || '?'}
                      </div>
                    </div>
                    <button className="p-2 bg-gray-50 rounded-xl group-hover:bg-black group-hover:text-white transition-all">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100">
            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-black mb-2">No rides yet</h3>
            <p className="text-gray-500 font-medium mb-8">Your past trips will appear here.</p>
            <button className="bg-black text-white px-8 py-4 rounded-2xl font-black hover:bg-gray-800 transition-all">
              Book your first ride
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RideHistory;
