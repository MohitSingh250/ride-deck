import React, { useState } from 'react';
import { ArrowRight, MapPin, Navigation, Calendar, Clock, Car, Gift, Smartphone, Globe, ShieldCheck, Star, ChevronRight } from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === 'driver') {
    return <Navigate to="/driver-dashboard" replace />;
  }

  const handleSeePrices = (e) => {
    e.preventDefault();
    if (user) {
        navigate(user.role === 'driver' ? '/driver-dashboard' : '/rider-dashboard');
    } else {
        navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <div className="relative h-[90vh] flex items-center overflow-hidden">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/home_hero_gen.png" 
            alt="Hero Background" 
            className="w-full h-full object-cover brightness-75 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="text-4xl font-black text-white tracking-tighter">RideDeck</span>
            </div>
            
            <h1 className="text-6xl lg:text-8xl font-bold text-white leading-[1] mb-8 tracking-tight">
              Your ride, <br />
              <span className="text-white/70">reimagined.</span>
            </h1>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl mb-12 flex items-center gap-3 border border-white/20 inline-flex">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Gift className="h-3 w-3 text-white" />
              </div>
              <p className="text-sm font-medium text-white">
                50% OFF your first 5 rides
              </p>
            </div>
          </motion.div>
        </div>

        {/* Removed Hero Booking Bar - Now persistent at bottom */}
      </div>


      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 border-t border-zinc-100">
        <h2 className="text-3xl font-bold text-black mb-8">Suggestions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => navigate(user?.role === 'driver' ? '/driver-dashboard' : '/rider-dashboard')}
            className="bg-zinc-50 p-6 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-zinc-100 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Car className="h-8 w-8 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Ride</h3>
                <p className="text-sm text-zinc-500">Go anywhere with RideDeck</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <div 
            onClick={() => navigate(user?.role === 'driver' ? '/driver-dashboard' : '/rider-dashboard')}
            className="bg-zinc-50 p-6 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-zinc-100 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="h-8 w-8 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Reserve</h3>
                <p className="text-sm text-zinc-500">Book your ride in advance</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </div>

          <div 
            onClick={() => navigate('/help')}
            className="bg-zinc-50 p-6 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-zinc-100 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Smartphone className="h-8 w-8 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Package</h3>
                <p className="text-sm text-zinc-500">Send items across the city</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>


      <div className="bg-zinc-50 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/images/home_reserve_gen.png" 
                alt="RideDeck Reserve" 
                className="w-full h-auto rounded-3xl shadow-xl object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl lg:text-5xl font-bold text-black mb-8">
                Plan for later
              </h2>
              <p className="text-xl text-zinc-600 mb-12 leading-relaxed">
                Choose your exact pickup time up to 90 days in advance. Extra wait time included to meet your ride. Cancel at no charge up to 60 minutes in advance.
              </p>
              <button onClick={() => navigate(user?.role === 'driver' ? '/driver-dashboard' : '/rider-dashboard')} className="uber-btn-black px-12 py-4 text-lg">
                Reserve a ride
              </button>
            </div>
          </div>
        </div>
      </div>


      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-4xl font-bold text-black mb-8">
            {user ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Ready to get started?'}
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            {user ? (
              <button 
                onClick={() => navigate(user.role === 'driver' ? '/driver-dashboard' : '/rider-dashboard')}
                className="uber-btn-black px-12 py-4 text-lg"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link to="/signup" className="uber-btn-black px-12 py-4 text-lg">
                  Sign up to ride
                </Link>
                <Link to="/login" className="uber-btn-white px-12 py-4 text-lg">
                  Log in
                </Link>
              </>
            )}
        </div>
      </div>
      {/* Persistent Bottom Booking Bar */}
      <div className="booking-bar-container">
        <form onSubmit={handleSeePrices} className="booking-bar-rect">
          <div className="input-group">
            <div className="input-icon bg-black" />
            <input
              type="text"
              placeholder="Pickup location"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="uber-input-minimal"
            />
          </div>

          <div className="input-group">
            <div className="input-icon bg-black rounded-sm" />
            <input
              type="text"
              placeholder="Where to?"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              className="uber-input-minimal"
            />
          </div>

          <button type="submit" className="w-full lg:w-auto px-10 py-4 bg-black text-white rounded-[20px] font-bold text-base hover:bg-zinc-800 transition-all active:scale-95 whitespace-nowrap">
            Check Prices
          </button>
        </form>
      </div>
    </div>
  </div>
  );
};

export default Home;
