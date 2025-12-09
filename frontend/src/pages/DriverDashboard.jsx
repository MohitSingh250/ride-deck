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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    let interval;
    if (isOnline && subscriptionStatus === 'active') {
      const fetchRides = async () => {
        try {
          const response = await fetch(`${API_URL}/api/rides/available`);
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
      const response = await fetch(`${API_URL}/api/driver/status`, {
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
      const response = await fetch(`${API_URL}/api/driver/subscription`, {
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
      const response = await fetch(`${API_URL}/api/rides/accept`, {
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
      const response = await fetch(`${API_URL}/api/rides/update-status`, {
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
    <div className="pt-40 mt-20 min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Driver Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <span className={`mr-3 text-sm font-bold ${isOnline ? 'text-green-600' : 'text-gray-400'} px-2`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <button
              onClick={toggleStatus}
              disabled={subscriptionStatus !== 'active'}
              className={`relative inline-flex flex-shrink-0 h-8 w-14 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                isOnline ? 'bg-black' : 'bg-gray-200'
              } ${subscriptionStatus !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                  isOnline ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Active Ride Section */}
        {activeRide && (
            <div className="bg-black text-white rounded-3xl p-6 mb-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gray-800 rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-bold mb-1">Current Trip</h3>
                            <p className="text-gray-400 text-sm">Ride ID: #{activeRide._id.slice(-6)}</p>
                        </div>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                            {activeRide.status}
                        </span>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center gap-1 mt-1">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <div className="w-0.5 h-10 bg-gray-700"></div>
                                <div className="w-3 h-3 bg-white rounded-square"></div>
                            </div>
                            <div className="flex-1 space-y-6">
                                <div>
                                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Pickup</p>
                                    <p className="font-medium text-lg">{activeRide.pickup.address}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Dropoff</p>
                                    <p className="font-medium text-lg">{activeRide.dropoff.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        {activeRide.status === 'accepted' && (
                            <>
                                <input 
                                    type="text" 
                                    placeholder="Enter OTP" 
                                    className="bg-gray-900 border border-gray-700 text-white p-3 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent w-full sm:w-48 text-center font-bold tracking-widest"
                                    value={otpInput}
                                    onChange={(e) => setOtpInput(e.target.value)}
                                />
                                <button 
                                    onClick={() => updateRideStatus('started')}
                                    className="w-full sm:w-auto bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Start Ride
                                </button>
                            </>
                        )}

                        {activeRide.status === 'started' && (
                            <button 
                                onClick={() => updateRideStatus('completed')}
                                className="w-full bg-green-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-900/20"
                            >
                                Complete Ride
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <dt className="text-sm font-bold text-gray-400 uppercase tracking-wider">Today's Earnings</dt>
            <dd className="mt-2 text-4xl font-black text-black">₹{earnings}</dd>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <dt className="text-sm font-bold text-gray-400 uppercase tracking-wider">Rides Completed</dt>
            <dd className="mt-2 text-4xl font-black text-black">0</dd>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 ${subscriptionStatus === 'active' ? 'bg-green-100' : 'bg-red-100'}`}></div>
            <dt className="text-sm font-bold text-gray-400 uppercase tracking-wider">Subscription</dt>
            <dd className="mt-2 flex items-center justify-between">
                <span className={`text-xl font-bold ${subscriptionStatus === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {subscriptionStatus === 'active' ? 'Active' : 'Expired'}
                </span>
                {subscriptionStatus !== 'active' && (
                    <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gray-800"
                    >
                        Renew
                    </button>
                )}
            </dd>
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
                    <li key={ride._id} className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex-1">
                        <div className="flex items-start gap-2 mb-1">
                            <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 uppercase tracking-wide">Pickup</span>
                            <p className="text-sm font-medium text-gray-900">{ride.pickup.address}</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 uppercase tracking-wide">Dropoff</span>
                            <p className="text-sm text-gray-500">{ride.dropoff.address}</p>
                        </div>
                        <p className="text-xs text-black font-bold mt-2 bg-green-50 inline-block px-2 py-1 rounded">
                            Earn ₹{ride.fare} • {ride.vehicleType}
                        </p>
                    </div>
                    <button
                        onClick={() => acceptRide(ride._id)}
                        className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-green-700 shadow-md transition-transform transform active:scale-95"
                    >
                        Accept Ride
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
