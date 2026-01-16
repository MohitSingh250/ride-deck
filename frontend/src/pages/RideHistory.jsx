import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, CreditCard, ChevronRight, Star, ArrowRight, Filter } from 'lucide-react';

const RideHistory = () => {
  const [filter, setFilter] = useState('all');

  const rides = [
    {
      id: 'RD-9283',
      date: 'Today, 2:45 PM',
      pickup: 'Connaught Place, New Delhi',
      dropoff: 'Indira Gandhi International Airport',
      fare: '₹450',
      status: 'Completed',
      car: 'Swift Dzire',
      driver: 'Rajesh K.'
    },
    {
      id: 'RD-9120',
      date: 'Yesterday, 10:15 AM',
      pickup: 'Hauz Khas Village',
      dropoff: 'Cyber Hub, Gurgaon',
      fare: '₹320',
      status: 'Completed',
      car: 'WagonR',
      driver: 'Amit S.'
    },
    {
      id: 'RD-8945',
      date: 'Jan 12, 2026',
      pickup: 'Saket Metro Station',
      dropoff: 'Vasant Kunj',
      fare: '₹180',
      status: 'Cancelled',
      car: 'UberGo',
      driver: 'N/A'
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-black tracking-tight">Your Activity</h1>
            <p className="text-zinc-500 font-medium">View and manage your past rides</p>
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
          {rides.map((ride, i) => (
            <motion.div
              key={ride.id}
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
                        <p className="font-bold text-black">{ride.date}</p>
                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{ride.id}</p>
                      </div>
                    </div>
                    <div className="md:hidden">
                      <p className="text-xl font-bold text-black">{ride.fare}</p>
                    </div>
                  </div>

                  <div className="space-y-4 relative">
                    <div className="absolute left-[7px] top-[8px] bottom-[8px] w-[1px] bg-zinc-200" />
                    <div className="flex gap-4 relative">
                      <div className="w-4 h-4 bg-black rounded-full mt-1 z-10 border-4 border-zinc-50" />
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Pickup</p>
                        <p className="font-bold text-black line-clamp-1">{ride.pickup}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 relative">
                      <div className="w-4 h-4 bg-black rounded-sm mt-1 z-10 border-4 border-zinc-50" />
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Dropoff</p>
                        <p className="font-bold text-black line-clamp-1">{ride.dropoff}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col justify-between items-end md:w-32">
                  <div className="hidden md:block text-right">
                    <p className="text-2xl font-bold text-black">{ride.fare}</p>
                    <p className={`text-xs font-bold uppercase tracking-widest ${ride.status === 'Completed' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {ride.status}
                    </p>
                  </div>
                  <button className="uber-btn-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                    <ChevronRight className="h-5 w-5 text-black" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center pt-8">
          <button className="text-black font-bold hover:underline flex items-center gap-2 mx-auto">
            Load older activity <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideHistory;
