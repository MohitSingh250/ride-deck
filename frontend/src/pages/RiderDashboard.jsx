import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Star, Car, Bike, Truck, CheckCircle, Bell, Gift, Map as MapIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Map from '../components/Map';
import Modal from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';

const RiderDashboard = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('bike');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('');
  const [currentRide, setCurrentRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeDetails, setRouteDetails] = useState(null);
  const [calculatedFares, setCalculatedFares] = useState({ bike: 0, auto: 0, cab: 0 });
  const [brands, setBrands] = useState([]);
  const [nearbyBrand, setNearbyBrand] = useState(null);
  const [showBrandNotification, setShowBrandNotification] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const vehicles = [
    { id: 'bike', name: 'Bike', icon: Bike, price: `₹${calculatedFares.bike}`, time: routeDetails ? `${Math.round(routeDetails.duration / 60)} min` : '5 min' },
    { id: 'auto', name: 'Auto', icon: Truck, price: `₹${calculatedFares.auto}`, time: routeDetails ? `${Math.round(routeDetails.duration / 60)} min` : '8 min' },
    { id: 'cab', name: 'Cab', icon: Car, price: `₹${calculatedFares.cab}`, time: routeDetails ? `${Math.round(routeDetails.duration / 60)} min` : '12 min' },
  ];

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchActiveRide = async () => {
      try {
        const response = await fetch(`${API_URL}/api/rides/my-ride`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await response.json();
        if (data) {
          setCurrentRide(data);
          if (data.status === 'completed') setShowRatingModal(true);
        }
      } catch (error) {
        console.error('Error fetching ride:', error);
      }
    };

    const fetchBrands = async () => {
      try {
        const response = await fetch(`${API_URL}/api/brands`);
        const data = await response.json();
        setBrands(data);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };

    if (user) {
      fetchActiveRide();
      fetchBrands();
    }
  }, [user, API_URL]);

  useEffect(() => {
    if (!socket) return;

    socket.on('rideAccepted', (ride) => {
      setCurrentRide(ride);
      setBookingStatus('Driver Accepted!');
      toast.success('Driver found!');
    });

    socket.on('rideStatusUpdate', (ride) => {
      setCurrentRide(ride);
      if (ride.status === 'started') {
        setBookingStatus('Ride Started!');
        toast.success('Your ride has started!');
      }
      if (ride.status === 'completed') {
        setBookingStatus('Ride Completed!');
        setShowRatingModal(true);
      }
      if (ride.status === 'cancelled') {
        setCurrentRide(null);
        setBookingStatus('');
        toast.error('Ride cancelled');
      }
    });
  }, [socket]);

  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    if (currentRide?.status === 'started' && routeDetails?.coordinates) {
      let index = 0;
      const interval = setInterval(() => {
        if (index < routeDetails.coordinates.length) {
          const coord = routeDetails.coordinates[index];
          setDriverLocation([coord.lat, coord.lng]);
          
          // Check for nearby brands
          brands.forEach(brand => {
            brand.locations.forEach(loc => {
              const dist = Math.sqrt(Math.pow(coord.lat - loc.lat, 2) + Math.pow(coord.lng - loc.lng, 2));
              if (dist < 0.005) { // Roughly 500m
                setNearbyBrand(brand);
                setShowBrandNotification(true);
              }
            });
          });

          index += Math.ceil(routeDetails.coordinates.length / 100);
        } else {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentRide?.status, routeDetails, brands]);

  const handleRouteFound = (details) => {
    setRouteDetails(details);
    const distanceKm = details.distance / 1000;
    setCalculatedFares({
      bike: Math.round(20 + distanceKm * 8),
      auto: Math.round(30 + distanceKm * 12),
      cab: Math.round(50 + distanceKm * 18),
    });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!pickup || !dropoff) {
      toast.error('Please enter pickup and dropoff locations');
      return;
    }
    
    setLoading(true);
    setBookingStatus('Finding a driver...');
    
    try {
      const response = await fetch(`${API_URL}/api/rides/book`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          pickup,
          dropoff,
          vehicleType: selectedVehicle,
          fare: calculatedFares[selectedVehicle]
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setCurrentRide(data);
        toast.success('Ride requested successfully!');
      } else {
        setBookingStatus('Booking Failed: ' + data.message);
        toast.error(data.message || 'Booking failed');
      }
    } catch (error) {
      setBookingStatus('Error: ' + error.message);
      toast.error('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    setShowCancelConfirm(false);
    try {
      const response = await fetch(`${API_URL}/api/rides/update-status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ rideId: currentRide._id, status: 'cancelled' }),
      });
      
      if (response.ok) {
        setCurrentRide(null);
        setBookingStatus('');
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
          rideId: currentRide._id,
          revieweeId: currentRide.driverId._id,
          rating,
          comment
        }),
      });
      
      if (response.ok) {
        setShowRatingModal(false);
        setCurrentRide(null);
        setBookingStatus('');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-slate-900 relative overflow-hidden flex flex-col">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <Map 
          center={currentRide?.pickup?.lat ? [currentRide.pickup.lat, currentRide.pickup.lng] : [28.6139, 77.2090]} 
          pickup={currentRide?.pickup?.lat ? [currentRide.pickup.lat, currentRide.pickup.lng] : null}
          dropoff={currentRide?.dropoff?.lat ? [currentRide.dropoff.lat, currentRide.dropoff.lng] : null}
          markers={[
            ...(currentRide ? [
              { position: [currentRide.pickup.lat, currentRide.pickup.lng], popup: 'Pickup' },
              { position: [currentRide.dropoff.lat, currentRide.dropoff.lng], popup: 'Dropoff' }
            ] : []),
            ...(driverLocation ? [{ position: driverLocation, popup: 'Driver', icon: 'car' }] : []),
            ...brands.flatMap(brand => brand.locations.map(loc => ({
              position: [loc.lat, loc.lng],
              popup: brand.name,
              icon: 'brand',
              logo: brand.logo
            })))
          ]}
          onRouteFound={handleRouteFound}
        />
      </div>

      {/* Brand Notification Overlay */}
      <AnimatePresence>
        {showBrandNotification && nearbyBrand && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
          >
            <div className="glass p-4 rounded-3xl flex items-center gap-4 shadow-2xl border-indigo-500/30">
              <div className="h-12 w-12 rounded-2xl bg-white p-2 shadow-inner">
                <img src={nearbyBrand.logo} alt={nearbyBrand.name} className="h-full w-full object-contain" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-indigo-600" />
                  {nearbyBrand.name} Nearby!
                </h4>
                <p className="text-xs font-medium text-slate-600">{nearbyBrand.offerText}</p>
              </div>
              <button 
                onClick={() => setShowBrandNotification(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main UI Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-end md:justify-start md:p-8 pointer-events-none">
        <AnimatePresence mode="wait">
          {currentRide && currentRide.status !== 'completed' ? (
            <motion.div 
              key="active-ride"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="glass w-full md:w-[400px] md:rounded-[2.5rem] shadow-2xl pointer-events-auto overflow-hidden border-white/40"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
                      {currentRide.status === 'searching' ? 'Finding your ride' : 'On our way'}
                    </h2>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                      {currentRide.status}
                    </p>
                  </div>
                  <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg">
                    <Navigation className="h-6 w-6 animate-pulse" />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-3xl p-6 flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Clock className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Share with driver</p>
                      <p className="text-2xl font-black text-slate-900 tracking-widest">{currentRide.otp}</p>
                    </div>
                  </div>
                </div>

                {currentRide.driverId && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                          {currentRide.driverId.profilePicture ? (
                            <img src={currentRide.driverId.profilePicture} alt="Driver" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-2xl font-black text-indigo-600">{currentRide.driverId.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{currentRide.driverId.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-black text-slate-600">{currentRide.driverId.rating || '5.0'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">{currentRide.driverId.vehicleNumber}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentRide.driverId.vehicleType}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <div className="h-3 w-3 bg-indigo-600 rounded-full ring-4 ring-indigo-100"></div>
                      <div className="w-0.5 flex-1 bg-slate-100"></div>
                      <div className="h-3 w-3 border-2 border-slate-900 rounded-sm"></div>
                    </div>
                    <div className="flex-1 space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pickup</p>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{currentRide.pickup.address}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dropoff</p>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{currentRide.dropoff.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full py-4 text-rose-500 font-black text-sm uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all border-2 border-transparent hover:border-rose-100"
                >
                  Cancel Ride
                </button>
              </div>
            </motion.div>
          ) : !currentRide ? (
            <motion.div 
              key="booking-form"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="glass w-full md:w-[450px] md:rounded-[3rem] shadow-2xl pointer-events-auto flex flex-col max-h-[85vh] md:max-h-[calc(100vh-140px)] overflow-hidden border-white/40"
            >
              <div className="p-10 border-b border-slate-100">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Where are we going?</h2>
              </div>
              
              <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
                <form onSubmit={handleBook} className="space-y-8">
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold"
                        placeholder="Pickup Location"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        required
                      />
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Navigation className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold"
                        placeholder="Dropoff Location"
                        value={dropoff}
                        onChange={(e) => setDropoff(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Vehicle</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {vehicles.map((vehicle) => (
                        <div
                          key={vehicle.id}
                          onClick={() => setSelectedVehicle(vehicle.id)}
                          className={`flex items-center justify-between p-5 rounded-[2rem] cursor-pointer transition-all border-2 ${
                            selectedVehicle === vehicle.id
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100'
                              : 'border-transparent bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-2xl transition-all ${selectedVehicle === vehicle.id ? 'accent-gradient text-white shadow-lg' : 'bg-white text-slate-600 shadow-sm'}`}>
                              <vehicle.icon className="h-7 w-7" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900">{vehicle.name}</p>
                              <p className="text-xs font-bold text-slate-500">{vehicle.time} away</p>
                            </div>
                          </div>
                          <span className="font-black text-xl text-slate-900">{vehicle.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 accent-gradient text-white rounded-[2rem] text-lg font-black shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all uppercase tracking-widest"
                  >
                    {loading ? 'Finding Driver...' : `Confirm ${vehicles.find(v => v.id === selectedVehicle)?.name}`}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Cancel Ride?"
        maxWidth="max-w-md"
      >
        <div className="text-center">
          <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <X className="h-10 w-10 text-rose-500" />
          </div>
          <p className="text-slate-500 font-bold mb-10 leading-relaxed">
            Are you sure? Your driver is already on the way.
          </p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleCancelRide}
              className="w-full py-5 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-200 uppercase tracking-widest"
            >
              Yes, Cancel
            </button>
            <button 
              onClick={() => setShowCancelConfirm(false)}
              className="w-full py-5 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest"
            >
              No, Keep
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title="Arrived!"
        maxWidth="max-w-md"
      >
        <div className="text-center">
          <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
          </div>
          <p className="text-slate-500 font-bold mb-10">
            How was your trip with {currentRide?.driverId?.name}?
          </p>
          
          <div className="flex justify-center gap-3 mb-10">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                onClick={() => setRating(star)}
                className={`h-12 w-12 cursor-pointer transition-all ${star <= rating ? 'text-amber-400 fill-amber-400 scale-110' : 'text-slate-100'}`}
              />
            ))}
          </div>

          <textarea
            className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold mb-10 resize-none"
            placeholder="Any feedback for the driver?"
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>

          <button 
            onClick={submitReview}
            className="w-full py-6 accent-gradient text-white font-black rounded-[2rem] hover:scale-[1.02] transition-all shadow-2xl shadow-indigo-200 uppercase tracking-widest"
          >
            Complete Review
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default RiderDashboard;
