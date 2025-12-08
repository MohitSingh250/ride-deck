import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DriverDashboard = () => {
  const { user } = useAuth();
  const [availableRides, setAvailableRides] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    if (user?.subscriptionStatus) {
      setSubscriptionStatus(user.subscriptionStatus);
    }
    if (user?.isOnline) {
      setIsOnline(user.isOnline);
    }
  }, [user]);

  // Poll for rides when online and subscribed
  useEffect(() => {
    let interval;
    if (isOnline && subscriptionStatus === 'active') {
      const fetchRides = async () => {
        try {
          const response = await fetch('http://localhost:4000/api/rides/available');
          const data = await response.json();
          setAvailableRides(data);
        } catch (error) {
          console.error('Error fetching rides:', error);
        }
      };
      
      fetchRides(); // Initial fetch
      interval = setInterval(fetchRides, 5000); // Poll every 5 seconds
    } else {
      setAvailableRides([]);
    }
    return () => clearInterval(interval);
  }, [isOnline, subscriptionStatus]);

  const toggleStatus = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/driver/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, isOnline: !isOnline }),
      });
      const data = await response.json();
      if (data.success) {
        setIsOnline(data.isOnline);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('weekly');

  // ... (existing useEffects)

  const activateSubscription = async (planId) => {
    try {
      const response = await fetch('http://localhost:4000/api/driver/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, plan: planId }),
      });
      const data = await response.json();
      if (data.success) {
        setSubscriptionStatus(data.subscriptionStatus);
        setShowSubscriptionModal(false);
        alert('Subscription Activated Successfully! You are now online.');
      }
    } catch (error) {
      console.error('Error activating subscription:', error);
    }
  };

  const [activeRide, setActiveRide] = useState(null);
  const [otpInput, setOtpInput] = useState('');

  const acceptRide = async (rideId) => {
    try {
      const response = await fetch('http://localhost:4000/api/rides/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, driverId: user._id }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Ride Accepted! Navigate to pickup.');
        setActiveRide(data);
        setAvailableRides(prev => prev.filter(r => r._id !== rideId));
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  const updateRideStatus = async (status) => {
    try {
      const response = await fetch('http://localhost:4000/api/rides/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: activeRide._id, status, otp: otpInput }),
      });
      const data = await response.json();
      if (response.ok) {
        setActiveRide(data);
        if (status === 'completed') {
            alert('Ride Completed! Fare: ₹' + data.fare);
            setEarnings(prev => prev + data.fare);
            setActiveRide(null);
            setOtpInput('');
        }
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
          <div className="flex items-center">
            <span className={`mr-3 text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
              {isOnline ? 'You are Online' : 'You are Offline'}
            </span>
            <button
              onClick={toggleStatus}
              disabled={subscriptionStatus !== 'active'}
              className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
                isOnline ? 'bg-green-500' : 'bg-gray-200'
              } ${subscriptionStatus !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                  isOnline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Active Ride Section */}
        {activeRide && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
                <h3 className="text-lg font-bold text-black mb-2">Active Ride</h3>
                <p>Pickup: {activeRide.pickup.address}</p>
                <p>Dropoff: {activeRide.dropoff.address}</p>
                <p className="font-bold mt-2">Status: {activeRide.status.toUpperCase()}</p>
                
                {activeRide.status === 'accepted' && (
                    <div className="mt-4 flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Enter OTP from Rider" 
                            className="border border-gray-300 p-2 rounded-lg focus:ring-black focus:border-black"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                        />
                        <button 
                            onClick={() => updateRideStatus('started')}
                            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 font-medium"
                        >
                            Start Ride
                        </button>
                    </div>
                )}

                {activeRide.status === 'started' && (
                    <div className="mt-4">
                        <button 
                            onClick={() => updateRideStatus('completed')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                        >
                            Complete Ride
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Today's Earnings</dt>
              <dd className="mt-1 text-3xl font-semibold text-black">₹{earnings}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Rides Completed</dt>
              <dd className="mt-1 text-3xl font-semibold text-black">0</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Subscription Status</dt>
              <dd className={`mt-1 text-lg font-semibold ${subscriptionStatus === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {subscriptionStatus === 'active' ? 'Active' : 'Expired'}
              </dd>
              {subscriptionStatus !== 'active' && (
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="mt-2 text-sm text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors w-full font-bold"
                >
                  Subscribe Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Modal */}
        {showSubscriptionModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-lg w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-black">Choose a Plan</h3>
                        <button onClick={() => setShowSubscriptionModal(false)} className="text-gray-400 hover:text-black">
                            <span className="text-2xl">×</span>
                        </button>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                        {[
                            { id: 'daily', name: 'Daily Pass', price: '₹49', desc: 'Valid for 24 hours' },
                            { id: 'weekly', name: 'Weekly Pass', price: '₹299', desc: 'Valid for 7 days', popular: true },
                            { id: 'monthly', name: 'Monthly Pass', price: '₹999', desc: 'Valid for 30 days' },
                        ].map((plan) => (
                            <div 
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                                    selectedPlan === plan.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-lg">{plan.name}</h4>
                                        {plan.popular && <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">Popular</span>}
                                    </div>
                                    <p className="text-gray-500 text-sm">{plan.desc}</p>
                                </div>
                                <span className="text-xl font-bold">{plan.price}</span>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => activateSubscription(selectedPlan)}
                        disabled={!selectedPlan}
                        className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Pay & Activate
                    </button>
                </div>
            </div>
        )}

        {/* Ride Requests */}
        {!activeRide && (
            <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Ride Requests</h3>
            {availableRides.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                {availableRides.map((ride) => (
                    <li key={ride._id} className="py-4 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium text-gray-900">Pickup: {ride.pickup.address}</p>
                        <p className="text-sm text-gray-500">Dropoff: {ride.dropoff.address}</p>
                        <p className="text-xs text-gray-400 mt-1">Fare: ₹{ride.fare} • {ride.vehicleType}</p>
                    </div>
                    <button
                        onClick={() => acceptRide(ride._id)}
                        className="ml-4 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                    >
                        Accept
                    </button>
                    </li>
                ))}
                </ul>
            ) : (
                <div className="text-center py-10 text-gray-500">
                {isOnline ? 'Waiting for ride requests...' : 'Go online to receive ride requests'}
                </div>
            )}
            </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
