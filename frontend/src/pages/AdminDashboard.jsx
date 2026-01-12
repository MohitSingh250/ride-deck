import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Car, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRides: 0,
    totalRevenue: 0,
    activeDrivers: 0
  });
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await response.json();
        setStats(data.stats);
        setRecentRides(data.recentRides);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchStats();
  }, [user, API_URL]);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total</span>
      </div>
      <h3 className="text-3xl font-black text-black">{value}</h3>
      <p className="text-sm text-gray-500 font-medium mt-1">{title}</p>
    </motion.div>
  );

  return (
    <div className="pt-24 min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-black tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-500 font-medium">Platform overview and statistics</p>
          </div>
          <div className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold">
            Live Updates
          </div>
        </div>

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[1,2,3,4].map(i => <div key={i} className="h-40 bg-white rounded-3xl animate-pulse"></div>)}
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Users" value={stats.totalUsers} icon={Users} color="bg-blue-500" />
            <StatCard title="Rides" value={stats.totalRides} icon={Car} color="bg-black" />
            <StatCard title="Revenue" value={`₹${stats.totalRevenue}`} icon={DollarSign} color="bg-green-500" />
            <StatCard title="Active Drivers" value={stats.activeDrivers} icon={Activity} color="bg-purple-500" />
          </div>
        )}

        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
          <h3 className="text-2xl font-black text-black mb-6">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">ID</th>
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">User</th>
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Driver</th>
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Status</th>
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Fare</th>
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentRides.map((ride) => (
                  <tr key={ride._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-medium text-gray-500">#{ride._id.slice(-6)}</td>
                    <td className="py-4 font-bold text-black">{ride.riderId?.name || 'Unknown'}</td>
                    <td className="py-4 font-bold text-black">{ride.driverId?.name || 'Pending'}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        ride.status === 'completed' ? 'bg-green-50 text-green-600' : 
                        ride.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {ride.status}
                      </span>
                    </td>
                    <td className="py-4 font-black text-black">₹{ride.fare}</td>
                    <td className="py-4 font-medium text-gray-500">{new Date(ride.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
