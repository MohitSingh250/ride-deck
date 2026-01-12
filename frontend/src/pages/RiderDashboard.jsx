import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Clock, Star, Car, Bike, Truck, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Map from '../components/Map';
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



  const vehicles = [
    { id: 'bike', name: 'Bike', icon: Bike, price: `₹${calculatedFares.bike}`, time: routeDetails ? `${Math.round(routeDetails.duration / 60)} min` : '5 min' },
    { id: 'auto', name: 'Auto', icon: Truck, price: `₹${calculatedFares.auto}`, time: routeDetails ? `${Math.round(routeDetails.duration / 60)} min` : '8 min' },
    { id: 'cab', name: 'Cab', icon: Car, price: `₹${calculatedFares.cab}`, time: routeDetails ? `${Math.round(routeDetails.duration / 60)} min` : '12 min' },
  ];

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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

    if (user) fetchActiveRide();
  }, [user, API_URL]);

  useEffect(() => {
    if (!socket) return;

    socket.on('rideAccepted', (ride) => {
      setCurrentRide(ride);
      setBookingStatus('Driver Accepted!');
    });

    socket.on('rideStatusUpdate', (ride) => {
      setCurrentRide(ride);
      if (ride.status === 'started') setBookingStatus('Ride Started!');
      if (ride.status === 'completed') {
        setBookingStatus('Ride Completed!');
        setShowRatingModal(true);
      }
      if (ride.status === 'cancelled') {
        setCurrentRide(null);
        setBookingStatus('');
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
          index += Math.ceil(routeDetails.coordinates.length / 100); // Move 1% per second
        } else {
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else if (currentRide?.driverId && !driverLocation) {
        // Initial driver location (mock or real)
        setDriverLocation([28.6139, 77.2090]); 
    }
  }, [currentRide?.status, routeDetails]);

  const handleRouteFound = (details) => {
    setRouteDetails(details);
    // Calculate fares based on distance (in meters)
    const distanceKm = details.distance / 1000;
    setCalculatedFares({
      bike: Math.round(20 + distanceKm * 8), // Base 20 + 8/km
      auto: Math.round(30 + distanceKm * 12), // Base 30 + 12/km
      cab: Math.round(50 + distanceKm * 18),  // Base 50 + 18/km
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
    <div className="pt-20 min-h-screen bg-gray-50 relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 z-0">
        <Map 
          center={currentRide?.pickup?.lat ? [currentRide.pickup.lat, currentRide.pickup.lng] : [28.6139, 77.2090]} 
          pickup={currentRide?.pickup?.lat ? [currentRide.pickup.lat, currentRide.pickup.lng] : null}
          dropoff={currentRide?.dropoff?.lat ? [currentRide.dropoff.lat, currentRide.dropoff.lng] : null}
          markers={currentRide ? [
            { position: [currentRide.pickup.lat, currentRide.pickup.lng], popup: 'Pickup' },
            { position: [currentRide.dropoff.lat, currentRide.dropoff.lng], popup: 'Dropoff' },
            ...(driverLocation ? [{ position: driverLocation, popup: 'Driver', icon: 'car' }] : [])
          ] : [{ position: [28.6139, 77.2090], popup: 'Current Location' }]}
          onRouteFound={handleRouteFound}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-end md:justify-start md:p-8 pointer-events-none">
        <AnimatePresence mode="wait">
          {currentRide && currentRide.status !== 'completed' ? (
            <motion.div 
              key="active-ride"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white w-full md:w-[450px] md:rounded-3xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-black uppercase tracking-tight">
                    {currentRide.status === 'searching' ? 'Finding Driver' : 'Ride in Progress'}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">Ride ID: #{currentRide._id.slice(-6)}</p>
                </div>
                <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                  {currentRide.status}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="bg-black p-3 rounded-xl">
                    <Clock className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">OTP for Driver</p>
                    <p className="text-2xl font-black text-black tracking-widest">{currentRide.otp}</p>
                  </div>
                </div>

                {currentRide.driverId && (
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {currentRide.driverId.profilePicture ? (
                          <img src={currentRide.driverId.profilePicture} alt="Driver" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-gray-400">{currentRide.driverId.name[0]}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-black">{currentRide.driverId.name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-bold text-gray-600">{currentRide.driverId.rating || '5.0'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-black">{currentRide.driverId.vehicleNumber}</p>
                      <p className="text-xs text-gray-500 uppercase">{currentRide.driverId.vehicleType}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <div className="h-2 w-2 bg-black rounded-full"></div>
                      <div className="w-0.5 flex-1 bg-gray-100"></div>
                      <div className="h-2 w-2 border-2 border-black rounded-sm"></div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Pickup</p>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{currentRide.pickup.address}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Dropoff</p>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{currentRide.dropoff.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {currentRide.status !== 'completed' && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors"
                  >
                    Cancel Ride
                  </button>
                )}
              </div>
            </motion.div>
          ) : !currentRide ? (
            <motion.div 
              key="booking-form"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white w-full md:w-[450px] md:rounded-3xl shadow-2xl pointer-events-auto flex flex-col max-h-[85vh] md:max-h-[calc(100vh-140px)] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-black text-black tracking-tight">Where to?</h2>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleBook} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black transition-all font-medium"
                        placeholder="Pickup Location"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        required
                      />
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Navigation className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black transition-all font-medium"
                        placeholder="Dropoff Location"
                        value={dropoff}
                        onChange={(e) => setDropoff(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Suggested Rides</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {vehicles.map((vehicle) => (
                        <div
                          key={vehicle.id}
                          onClick={() => setSelectedVehicle(vehicle.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                            selectedVehicle === vehicle.id
                              ? 'border-black bg-gray-50'
                              : 'border-transparent hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${selectedVehicle === vehicle.id ? 'bg-black text-white' : 'bg-white text-gray-600 shadow-sm'}`}>
                              <vehicle.icon className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-bold text-black">{vehicle.name}</p>
                              <p className="text-xs text-gray-500 font-medium">{vehicle.time} away</p>
                            </div>
                          </div>
                          <span className="font-black text-lg text-black">{vehicle.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-black text-white rounded-2xl text-lg font-bold shadow-xl hover:bg-gray-800 disabled:opacity-50 transition-all transform active:scale-[0.98]"
                  >
                    {loading ? 'Finding Driver...' : `Confirm ${vehicles.find(v => v.id === selectedVehicle)?.name}`}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCancelConfirm && (
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
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full"
            >
              <h3 className="text-2xl font-black text-black mb-2">Cancel Ride?</h3>
              <p className="text-gray-500 font-medium mb-8">Are you sure you want to cancel? This action cannot be undone.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                >
                  No, Keep
                </button>
                <button 
                  onClick={handleCancelRide}
                  className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                >
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

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
              <h3 className="text-3xl font-black text-black mb-2">Ride Completed!</h3>
              <p className="text-gray-500 font-medium mb-8">How was your trip with {currentRide?.driverId?.name}?</p>
              
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

export default RiderDashboard;
