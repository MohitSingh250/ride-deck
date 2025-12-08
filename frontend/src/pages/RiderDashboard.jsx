import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Bike, Car, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Map from '../components/Map';

const RiderDashboard = () => {
  const { user } = useAuth();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('bike');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [bookingStatus, setBookingStatus] = useState('');
  const [currentRide, setCurrentRide] = useState(null);
  const isCancelling = useRef(false);

  const vehicles = [
    { id: 'bike', name: 'Bike', icon: Bike, price: '₹40', time: '5 min' },
    { id: 'auto', name: 'Auto', icon: Truck, price: '₹70', time: '8 min' },
    { id: 'cab', name: 'Cab', icon: Car, price: '₹120', time: '12 min' },
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Poll for current ride status
  useEffect(() => {
    let interval;
    if (user) {
      const fetchRide = async () => {
        if (isCancelling.current) return; // Skip polling if cancelling
        try {
          const response = await fetch(`${API_URL}/api/rides/my-ride/${user._id}`);
          const data = await response.json();
          console.log('Polling my-ride:', data); // Debug log
          if (data) {
            setCurrentRide(data);
            if (data.status === 'accepted') setBookingStatus('Driver Accepted! ' + data.driverId.name + ' is coming.');
            if (data.status === 'started') setBookingStatus('Ride Started! OTP: ' + data.otp);
            if (data.status === 'completed') setBookingStatus('Ride Completed! Please pay ₹' + data.fare);
          } else {
            setCurrentRide(null);
            setBookingStatus('');
          }
        } catch (error) {
          console.error('Error fetching ride:', error);
        }
      };
      
      fetchRide();
      interval = setInterval(fetchRide, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(interval);
  }, [user]);

  const handleBook = async (e) => {
    e.preventDefault();
    setBookingStatus('Booking...');
    isCancelling.current = false; // Reset cancel flag on new booking
    
    try {
      const response = await fetch(`${API_URL}/api/rides/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: user._id,
          pickup,
          dropoff,
          vehicleType: selectedVehicle,
          fare: selectedVehicle === 'bike' ? 40 : selectedVehicle === 'auto' ? 70 : 120
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setBookingStatus('Ride Booked! Waiting for driver...');
        setCurrentRide(data);
      } else {
        setBookingStatus('Booking Failed: ' + data.message);
      }
    } catch (error) {
      setBookingStatus('Error: ' + error.message);
    }
  };

  const handleCancelRide = async () => {
    setShowCancelConfirm(false);
    isCancelling.current = true; // Set flag immediately
    try {
        const response = await fetch(`${API_URL}/api/rides/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rideId: currentRide._id, status: 'cancelled' }),
        });
        
        if (response.ok) {
            setBookingStatus('');
            setCurrentRide(null);
            // alert('Ride cancelled successfully.'); // Removed alert
            // Keep flag true for a bit to avoid race condition with in-flight polls
            setTimeout(() => { isCancelling.current = false; }, 5000);
        } else {
            // alert('Failed to cancel ride.'); // Removed alert
            setBookingStatus('Failed to cancel ride');
            isCancelling.current = false;
        }
    } catch (e) {
        console.error(e);
        setBookingStatus('Error cancelling ride');
        isCancelling.current = false;
    }
  };

  if (currentRide && currentRide.status !== 'completed' && currentRide.status !== 'cancelled') {
    return (
      <div className="pt-16 min-h-screen bg-gray-100 p-6 flex flex-col items-center relative">
        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full transform transition-all scale-100">
                    <h3 className="text-xl font-bold text-black mb-2">Cancel Ride?</h3>
                    <p className="text-gray-500 mb-6">Are you sure you want to cancel? This action cannot be undone.</p>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowCancelConfirm(false)}
                            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            No, Keep
                        </button>
                        <button 
                            onClick={handleCancelRide}
                            className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                        >
                            Yes, Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4 text-black">Current Ride</h2>
            <div className="mb-4">
                <p className="text-gray-600">Status: <span className="font-bold text-gray-900 uppercase">{currentRide.status}</span></p>
                <p className="text-gray-600">OTP: <span className="font-bold text-xl text-black">{currentRide.otp}</span></p>
            </div>
            {currentRide.driverId && (
                <div className="border-t pt-4">
                    <p className="font-semibold">Driver: {currentRide.driverId.name}</p>
                    <p className="text-sm text-gray-500">{currentRide.driverId.vehicleNumber} ({currentRide.driverId.vehicleType})</p>
                    <p className="text-sm text-gray-500">Phone: {currentRide.driverId.phone}</p>
                </div>
            )}
            <div className="mt-6 text-sm text-gray-400">
                Pickup: {currentRide.pickup.address} <br/>
                Dropoff: {currentRide.dropoff.address}
            </div>
            
            {currentRide.status === 'searching' || currentRide.status === 'accepted' ? (
                <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="mt-6 w-full py-2 px-4 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors font-bold"
                >
                    Cancel Ride
                </button>
            ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Map Section */}
      <div className="w-full md:w-2/3 h-[50vh] md:h-auto relative z-0 order-2 md:order-1">
        <Map 
            center={[28.6139, 77.2090]} 
            markers={[
                { position: [28.6139, 77.2090], popup: 'Current Location' }
            ]}
        />
      </div>

      {/* Booking Form Section */}
      <div className="w-full md:w-1/3 bg-white p-6 shadow-2xl z-10 order-1 md:order-2 flex flex-col h-full overflow-y-auto">
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-black">Where to?</h2>
        </div>
        
        <form onSubmit={handleBook} className="space-y-6 flex-grow">
          <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="h-2 w-2 bg-black rounded-full"></div>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-4 border-none bg-gray-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black transition-shadow font-medium"
                  placeholder="Pickup Location"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="h-2 w-2 bg-black rounded-square"></div>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-4 border-none bg-gray-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black transition-shadow font-medium"
                  placeholder="Dropoff Location"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  required
                />
              </div>
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Suggested Rides</h3>
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border-2 ${
                  selectedVehicle === vehicle.id
                    ? 'border-black bg-gray-50 shadow-sm'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-16 h-12 flex items-center justify-center mr-4">
                    <vehicle.icon className={`h-10 w-10 ${selectedVehicle === vehicle.id ? 'text-black' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900">{vehicle.name}</p>
                    <p className="text-xs text-gray-500">{vehicle.time} away • <span className="text-gray-400">4 seats</span></p>
                  </div>
                </div>
                <span className="font-bold text-lg text-black">{vehicle.price}</span>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all transform hover:scale-[1.02]"
          >
            {bookingStatus || `Confirm ${vehicles.find(v => v.id === selectedVehicle)?.name}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RiderDashboard;
