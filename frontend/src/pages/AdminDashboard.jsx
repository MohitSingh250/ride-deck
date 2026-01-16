import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Car, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  Search,
  Filter,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Map from '../components/Map';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, totalDrivers: 0, totalRides: 0, revenue: 0 });
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [recentRides, setRecentRides] = useState([]);
  const [activeRides, setActiveRides] = useState([]);
  const [liveLocations, setLiveLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDriverDocs, setSelectedDriverDocs] = useState(null);
  const socket = useSocket();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const fetchData = async () => {
    try {
      const [statsRes, driversRes, allDriversRes, ridesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }),
        fetch(`${API_URL}/api/admin/drivers/pending`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }),
        fetch(`${API_URL}/api/admin/drivers`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }),
        fetch(`${API_URL}/api/admin/rides`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const driversData = await driversRes.json();
      const allDriversData = await allDriversRes.json();
      const ridesData = await ridesRes.json();

      if (statsRes.ok) setStats(statsData);
      if (driversRes.ok) setPendingDrivers(driversData);
      if (allDriversRes.ok) setAllDrivers(allDriversData);
      if (ridesRes.ok) setRecentRides(ridesData);
    } catch (error) {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'monitor') {
      const fetchActiveRides = async () => {
        try {
          const res = await fetch(`${API_URL}/api/admin/rides/active`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          const data = await res.json();
          if (res.ok) setActiveRides(data);
        } catch (error) {
          console.error('Failed to fetch active rides');
        }
      };
      fetchActiveRides();
    }
  }, [activeTab, API_URL, user.token]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join-admin');

    socket.on('admin-location-update', ({ rideId, location, driverId }) => {
      setLiveLocations(prev => ({
        ...prev,
        [rideId]: location
      }));
    });

    socket.on('admin-sos-alert', ({ userName, rideId }) => {
      toast.error(`🚨 SOS ALERT: ${userName} on ride #${rideId.slice(-6)}`, {
        duration: 10000,
        position: 'top-right'
      });
    });

    return () => {
      socket.off('admin-location-update');
      socket.off('admin-sos-alert');
    };
  }, [socket]);

  const handleVerifyDriver = async (driverId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/drivers/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ driverId, status }),
      });

      if (response.ok) {
        toast.success(`Driver ${status} successfully`);
        fetchData();
      }
    } catch (error) {
      toast.error('Verification failed');
    }
  };

  const handleForceCancel = async (rideId) => {
    if (!window.confirm('Are you sure you want to force cancel this ride?')) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/rides/${rideId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        toast.success('Ride cancelled successfully');
        // Refresh active rides
        const res = await fetch(`${API_URL}/api/admin/rides/active`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) setActiveRides(await res.json());
      } else {
        toast.error('Failed to cancel ride');
      }
    } catch (error) {
      toast.error('Error cancelling ride');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }


  // ... (existing code)

  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-50 px-4 md:px-8">
      {/* Document Viewer Modal */}
      <AnimatePresence>
        {selectedDriverDocs && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setSelectedDriverDocs(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-[2.5rem] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">KYC Documents</h2>
                    <p className="text-slate-500 font-bold">Verify documents for {selectedDriverDocs.name}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedDriverDocs(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <XCircle className="h-8 w-8 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: 'Driving License', src: selectedDriverDocs.kycDocuments?.license },
                    { title: 'Vehicle RC', src: selectedDriverDocs.kycDocuments?.rc },
                    { title: 'Selfie', src: selectedDriverDocs.kycDocuments?.selfie }
                  ].map((doc, i) => (
                    <div key={i} className="space-y-3">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{doc.title}</p>
                      <div className="aspect-[3/4] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden relative group">
                        {doc.src ? (
                          <img 
                            src={doc.src} 
                            alt={doc.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onClick={() => window.open(doc.src, '_blank')}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold">
                            No Document
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 mt-8 pt-8 border-t border-slate-100">
                  <button
                    onClick={() => {
                      handleVerifyDriver(selectedDriverDocs._id, 'rejected');
                      setSelectedDriverDocs(null);
                    }}
                    className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-xl font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => {
                      handleVerifyDriver(selectedDriverDocs._id, 'verified');
                      setSelectedDriverDocs(null);
                    }}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all"
                  >
                    Approve Driver
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* ... (existing header code) ... */}

        {activeTab === 'overview' && (
          <div className="space-y-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Riders', value: stats.totalUsers, icon: Users, color: 'indigo' },
                { label: 'Active Drivers', value: stats.totalDrivers, icon: Car, color: 'emerald' },
                { label: 'Completed Rides', value: stats.totalRides, icon: CheckCircle, color: 'amber' },
                { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: 'rose' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
                >
                  <div className={`h-14 w-14 rounded-2xl bg-${item.color}-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`h-7 w-7 text-${item.color}-600`} />
                  </div>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">{item.label}</p>
                  <h3 className="text-3xl font-black text-slate-900">{item.value}</h3>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Revenue Trend Chart */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                    Revenue Trends
                  </h2>
                  <select className="bg-slate-50 border-none text-xs font-black uppercase tracking-widest text-slate-400 rounded-xl px-4 py-2 focus:ring-0">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                  </select>
                </div>
                <div className="h-64 flex items-end gap-2 px-4">
                  {[45, 60, 40, 80, 55, 90, 75].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                      <div className="w-full bg-indigo-50 rounded-t-xl relative overflow-hidden transition-all group-hover:bg-indigo-100" style={{ height: `${height}%` }}>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: '100%' }}
                          transition={{ delay: i * 0.1, duration: 1 }}
                          className="absolute bottom-0 left-0 right-0 bg-indigo-600 rounded-t-xl"
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Verifications */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-indigo-600" />
                    Pending
                  </h2>
                  <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {pendingDrivers.length} New
                  </span>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {pendingDrivers.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <CheckCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-400 font-bold">All verified!</p>
                    </div>
                  ) : (
                    pendingDrivers.map((driver) => (
                      <div key={driver._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center font-black text-indigo-600 shadow-sm border border-slate-100">
                            {driver.name[0]}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">{driver.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400">{driver.phone}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedDriverDocs(driver)}
                          className="px-4 py-2 bg-white text-indigo-600 text-xs font-black uppercase tracking-widest rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-all"
                        >
                          View Docs
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Rides Table */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-indigo-600" />
                  Recent Platform Activity
                </h2>
                <button className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">View All Rides</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ride ID</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rider</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Driver</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Route</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fare</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentRides.slice(0, 8).map((ride) => (
                      <tr key={ride._id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="py-4 text-xs font-black text-slate-400">#{ride._id.slice(-6)}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">
                              {ride.riderId?.name[0]}
                            </div>
                            <span className="text-sm font-bold text-slate-900">{ride.riderId?.name}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          {ride.driverId ? (
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-600">
                                {ride.driverId?.name[0]}
                              </div>
                              <span className="text-sm font-bold text-slate-900">{ride.driverId?.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 italic">Searching...</span>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-0.5">
                            <p className="text-[10px] font-bold text-slate-900 truncate max-w-[150px]">{ride.pickup.address}</p>
                            <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{ride.dropoff.address}</p>
                          </div>
                        </td>
                        <td className="py-4 font-black text-slate-900 text-sm">₹{ride.fare}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            ride.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                            ride.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {ride.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'drivers' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-slate-900">Driver Management</h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search drivers..." 
                  className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-600 transition-all w-full md:w-80"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Driver</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allDrivers.map(driver => (
                    <tr key={driver._id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600">
                            {driver.name[0]}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{driver.name}</p>
                            <p className="text-xs font-bold text-slate-400">{driver.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-900">{driver.vehicleType}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{driver.vehicleNumber}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          driver.kycStatus === 'verified' ? 'bg-emerald-50 text-emerald-600' : 
                          driver.kycStatus === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {driver.kycStatus || 'Not Started'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-black text-slate-900">{driver.rating || '5.0'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {driver.kycStatus === 'pending' && (
                          <button 
                            onClick={() => setSelectedDriverDocs(driver)}
                            className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-700 transition-all mr-2"
                          >
                            Verify
                          </button>
                        )}
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                          <MoreVertical className="h-5 w-5 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'rides' && (
          <div className="space-y-6">
            {recentRides.map((ride) => (
              <motion.div
                key={ride._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8"
              >
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <Car className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-black text-slate-900">Ride #{ride._id.slice(-6)}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        ride.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {ride.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {ride.riderId?.name}</span>
                      <span className="flex items-center gap-1"><Car className="h-3 w-3" /> {ride.driverId?.name || 'Searching...'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 md:justify-center gap-10">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{ride.pickup.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{ride.dropoff.address}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">₹{ride.fare}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ride.paymentStatus}</p>
                  </div>
                  <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all">
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-indigo-600" />
                  Live Platform Monitor
                </h2>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></div>
                    {activeRides.length} Active Rides
                  </span>
                </div>
              </div>
              
              <div className="h-[600px] rounded-[2rem] overflow-hidden border border-slate-100 relative">
                <Map 
                  center={[28.6139, 77.2090]} 
                  zoom={12}
                  markers={activeRides.map(ride => ({
                    position: liveLocations[ride._id] ? [liveLocations[ride._id].lat, liveLocations[ride._id].lng] : [ride.pickup.lat, ride.pickup.lng],
                    popup: `Ride #${ride._id.slice(-6)} - ${ride.riderId?.name}`,
                    icon: 'car'
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeRides.map(ride => (
                <div key={ride._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-slate-900">#{ride._id.slice(-6)}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ride.status}</p>
                    </div>
                    <span className="text-indigo-600 font-black text-sm">₹{ride.fare}</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                      <p className="text-[10px] font-bold text-slate-600 truncate">{ride.pickup.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                      <p className="text-[10px] font-bold text-slate-600 truncate">{ride.dropoff.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center text-[8px] font-black text-indigo-600">
                        {ride.riderId?.name[0]}
                      </div>
                      <span className="text-[10px] font-bold text-slate-900">{ride.riderId?.name}</span>
                    </div>
                    {ride.driverId && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-900">{ride.driverId?.name}</span>
                        <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center text-[8px] font-black text-emerald-600">
                          {ride.driverId?.name[0]}
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleForceCancel(ride._id)}
                    className="w-full py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all"
                  >
                    Force Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Star = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default AdminDashboard;
