import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, LogOut, Camera, Star, Home, Briefcase, Plus, Trash2, Shield, MapPin, Clock, Wallet as WalletIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const [profileData, setProfileData] = useState(user);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/profile`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await response.json();
        if (response.ok) setProfileData(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_URL}/api/reviews/user/${user._id}`);
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
      fetchReviews();
    }
  }, [user, API_URL]);

  return (
    <div className="pt-32 min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12 pb-20">
        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-10 rounded-[3.5rem] shadow-2xl border-white/40 flex flex-col md:flex-row items-center gap-10"
        >
          <div className="relative group">
            <div className="h-40 w-40 bg-slate-900 rounded-[3rem] flex items-center justify-center text-white text-6xl font-black overflow-hidden shadow-2xl transform group-hover:rotate-3 transition-transform duration-500">
              {profileData.profilePicture ? (
                <img src={profileData.profilePicture} alt={profileData.name} className="h-full w-full object-cover" />
              ) : (
                profileData.name[0]
              )}
            </div>
            <button className="absolute -bottom-2 -right-2 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 hover:bg-slate-50 transition-all group-hover:scale-110">
              <Camera className="h-6 w-6 text-indigo-600" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <h1 className="text-5xl font-black text-slate-900 tracking-tight">{profileData.name}</h1>
              <p className="text-lg font-bold text-slate-400">{profileData.email || profileData.phone}</p>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-6">
              <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-2xl border border-white/40">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                <span className="text-lg font-black text-slate-900">{profileData.rating || '5.0'}</span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">({profileData.totalRatings || 0} reviews)</span>
              </div>
              <span className="accent-gradient text-white px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">
                {profileData.role}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-sm">
              Edit Profile
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Info Section */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-8"
          >
            <div className="glass p-8 rounded-[3rem] shadow-xl border-white/40 space-y-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Shield className="h-6 w-6 text-indigo-600" />
                Account Info
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Phone</p>
                    <p className="font-black text-slate-900">{profileData.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                    <WalletIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Wallet</p>
                    <p className="font-black text-slate-900">₹{profileData.walletBalance?.toLocaleString() || '0'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-purple-50 rounded-2xl text-purple-600">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Joined</p>
                    <p className="font-black text-slate-900">{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                {user.role === 'driver' && (
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Vehicle</p>
                      <p className="font-black text-slate-900">{user.vehicleNumber}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase">{user.vehicleType}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Reviews Section */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="glass p-10 rounded-[3.5rem] shadow-xl border-white/40 space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Recent Feedback</h3>
                <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                  <Star className="h-6 w-6" />
                </div>
              </div>
              
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-slate-50/50 rounded-3xl animate-pulse border border-slate-100"></div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review._id} className="bg-white/50 p-8 rounded-[2.5rem] border border-white/60 hover:bg-white transition-colors group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-100'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-slate-700 leading-relaxed italic">"{review.comment}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                  <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Star className="h-10 w-10 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No reviews yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
