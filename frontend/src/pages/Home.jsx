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
    <div className="min-h-screen bg-white font-sans pt-16">
      {/* Hero Section - Uber Ride Style */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side: Booking Form */}
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-8">
              <span className="text-4xl font-bold text-black tracking-tight">Ride</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-black leading-[1.1] mb-12">
              Request a ride for now or later
            </h1>

            <div className="bg-zinc-50 p-4 rounded-xl mb-8 flex items-center gap-3 border border-zinc-100">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                <Gift className="h-3 w-3 text-white" />
              </div>
              <p className="text-sm font-medium text-zinc-600">
                Up to 50% off your first 5 RideDeck rides. T&Cs apply.*
              </p>
            </div>

            <form onSubmit={handleSeePrices} className="space-y-4 relative">
              {/* Vertical Line connecting dots */}
              <div className="absolute left-[23px] top-[28px] bottom-[28px] w-[1px] bg-zinc-300 z-0" />
              
              <div className="relative z-10">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full" />
                <input
                  type="text"
                  placeholder="Pickup location"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-zinc-100 rounded-lg text-lg font-medium focus:ring-2 focus:ring-black outline-none transition-all"
                />
                <Navigation className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              </div>

              <div className="relative z-10">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-sm" />
                <input
                  type="text"
                  placeholder="Dropoff location"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-zinc-100 rounded-lg text-lg font-medium focus:ring-2 focus:ring-black outline-none transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="uber-btn-black flex-1 py-4 text-lg">
                  See prices
                </button>
                <button type="button" onClick={() => navigate('/rider-dashboard')} className="uber-btn-white flex-1 py-4 text-lg">
                  Schedule for later
                </button>
              </div>
            </form>
          </div>

          {/* Right Side: Illustration */}
          <div className="relative hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="rounded-3xl overflow-hidden shadow-2xl"
            >
              <img 
                src="/images/home_hero.png" 
                alt="RideDeck Hero" 
                className="w-full h-auto object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Suggestions Section */}
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

      {/* Reserve Section - Image 1 Style */}
      <div className="bg-zinc-50 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/images/home_reserve.png" 
                alt="RideDeck Reserve" 
                className="w-full h-auto rounded-3xl shadow-xl"
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

      {/* Footer-like CTA */}
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
      </div>
    </div>
  );
};

export default Home;
