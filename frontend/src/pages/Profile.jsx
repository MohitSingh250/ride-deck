import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, LogOut, Camera, Star, Home, Briefcase, Plus, Trash2, Shield, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
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

    if (user) fetchReviews();
  }, [user, API_URL]);

  return (
    <div className="pt-24 min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8"
        >
          <div className="relative">
            <div className="h-32 w-32 bg-black rounded-full flex items-center justify-center text-white text-5xl font-black overflow-hidden">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user.name[0]
              )}
            </div>
            <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-all">
              <Camera className="h-5 w-5 text-black" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-4xl font-black text-black tracking-tight">{user.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="text-lg font-black text-black">{user.rating || '5.0'}</span>
                <span className="text-sm text-gray-400 font-bold">({user.totalRatings || 0} reviews)</span>
              </div>
              <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {user.role}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <button className="bg-black text-white px-8 py-4 rounded-2xl font-black hover:bg-gray-800 transition-all">
              Edit Profile
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info Section */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-6">
              <h3 className="text-xl font-black text-black tracking-tight">Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Phone</p>
                    <p className="font-bold text-black">{user.phone}</p>
                  </div>
                </div>
                {user.role === 'driver' && (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Joined</p>
                        <p className="font-bold text-black">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Vehicle</p>
                        <p className="font-bold text-black">{user.vehicleNumber} ({user.vehicleType})</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
              <h3 className="text-2xl font-black text-black tracking-tight">Recent Reviews</h3>
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse"></div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    // Placeholder for review item rendering
                    <div key={review._id} className="bg-gray-50 p-4 rounded-2xl">
                      <p className="font-bold text-black">{review.comment}</p>
                      <p className="text-sm text-gray-500">Rating: {review.rating}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 font-bold">No reviews yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
