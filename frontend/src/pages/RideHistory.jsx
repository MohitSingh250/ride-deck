import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, MapPin, Calendar } from 'lucide-react';

const RideHistory = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/api/rides/history/${user._id}`);
        const data = await response.json();
        setRides(data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchHistory();
    }
  }, [user]);

  if (loading) return <div className="pt-24 text-center">Loading history...</div>;

  return (
    <div className="pt-24 min-h-screen bg-gray-50 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-black mb-8">Your Trips</h1>
        
        {rides.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No trips yet</h3>
            <p className="text-gray-500 mt-1">When you take a ride, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div key={ride._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex-1">
                        <div className="flex items-center mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                ride.status === 'completed' ? 'bg-green-100 text-green-800' :
                                ride.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {ride.status}
                            </span>
                            <span className="text-gray-400 text-sm ml-3">
                                {new Date(ride.createdAt).toLocaleDateString()} • {new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div className="flex items-start gap-3 mb-1">
                            <div className="mt-1 min-w-[16px]">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                            <p className="text-gray-900 font-medium">{ride.pickup.address}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 min-w-[16px]">
                                <div className="w-2 h-2 bg-black rounded-square"></div>
                            </div>
                            <p className="text-gray-900 font-medium">{ride.dropoff.address}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col justify-between items-center md:items-end border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                        <div className="text-right">
                            <p className="text-2xl font-bold text-black">₹{ride.fare}</p>
                            <p className="text-sm text-gray-500 capitalize">{ride.vehicleType}</p>
                        </div>
                        {ride.driverId && (
                            <div className="flex items-center mt-2 md:mt-4 bg-gray-50 px-3 py-1 rounded-lg">
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                                    {ride.driverId.name.charAt(0)}
                                </div>
                                <span className="text-sm text-gray-700">{ride.driverId.name}</span>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RideHistory;
