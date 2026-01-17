import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, ChevronRight, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const RideHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/rides/history?page=${page}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await response.json();
        if (response.ok) {
          if (page === 1) setRides(data.rides);
          else setRides(prev => [...prev, ...data.rides]);
          
          setHasMore(data.currentPage < data.totalPages);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [page, user.token]);

  const filteredRides = filter === 'all' ? rides : rides.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-100 rounded-full transition-all md:hidden">
              <ArrowLeft className="h-6 w-6 text-black" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-black tracking-tight">Your Activity</h1>
              <p className="text-zinc-500 font-medium">View and manage your past rides</p>
            </div>
          </div>
          <div className="flex gap-2">
            {['all', 'completed', 'cancelled'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${filter === f ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Ride List */}
        <div className="space-y-4">
          {loading && page === 1 ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (!filteredRides || filteredRides.length === 0) ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-black">No trips yet</h3>
              <p className="text-zinc-500">Your completed trips will appear here.</p>
            </div>
          ) : (
            filteredRides.map((ride, i) => (
              <motion.div
                key={ride._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 hover:border-black transition-all group cursor-pointer"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Calendar className="h-5 w-5 text-black" />
                        </div>
                        <div>
                          <p className="font-bold text-black">{new Date(ride.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">
                            {new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="md:hidden">
                        <p className="text-xl font-bold text-black">₹{ride.fare}</p>
                      </div>
                    </div>

                    <div className="space-y-4 relative">
                      <div className="absolute left-[7px] top-[8px] bottom-[8px] w-[1px] bg-zinc-200" />
                      <div className="flex gap-4 relative">
                        <div className="w-4 h-4 bg-black rounded-full mt-1 z-10 border-4 border-zinc-50" />
                        <div>
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Pickup</p>
                          <p className="font-bold text-black line-clamp-1">{ride.pickup.address}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 relative">
                        <div className="w-4 h-4 bg-black rounded-sm mt-1 z-10 border-4 border-zinc-50" />
                        <div>
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Dropoff</p>
                          <p className="font-bold text-black line-clamp-1">{ride.dropoff.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col justify-between items-end md:w-32">
                    <div className="hidden md:block text-right">
                      <p className="text-2xl font-bold text-black">₹{ride.fare}</p>
                      <p className={`text-xs font-bold uppercase tracking-widest ${ride.status === 'completed' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {ride.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                       {(user.role === 'rider' ? ride.driverRating : ride.riderRating) && (
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                          <span className="text-xs font-bold">{user.role === 'rider' ? ride.driverRating : ride.riderRating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && !loading && (
          <div className="text-center pt-8">
            <button 
              onClick={() => setPage(p => p + 1)}
              className="text-black font-bold hover:underline flex items-center gap-2 mx-auto"
            >
              Load older activity <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RideHistory;
