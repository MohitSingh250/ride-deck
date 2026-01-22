import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Shield, CreditCard, Gift, LogOut, ChevronRight, Camera, Edit2, CheckCircle, AlertTriangle, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [saving, setSaving] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState(user?.savedPlaces || []);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name,
        email: user.email,
        phone: user.phone
      });
      setSavedPlaces(user.savedPlaces || []);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlace = async (placeId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/saved-places/${placeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const updatedPlaces = await response.json();
        setSavedPlaces(updatedPlaces);
        updateUser({ savedPlaces: updatedPlaces });
        toast.success('Place removed');
      } else {
        toast.error('Failed to remove place');
      }
    } catch (error) {
      toast.error('Error removing place');
    }
  };

  const menuItems = [
    { icon: CreditCard, label: 'Payment Methods', color: 'text-zinc-400', description: 'Manage your cards and wallet' },
    { icon: Shield, label: 'Safety & Security', color: 'text-zinc-400', description: 'Emergency contacts and privacy' },
    { icon: Gift, label: 'Refer & Earn', color: 'text-zinc-400', link: '/referral', description: 'Invite friends and get rewards' },
  ];

  if (user?.role === 'driver') {
    menuItems.unshift({
      icon: user.kycStatus === 'verified' ? CheckCircle : AlertTriangle,
      label: 'Verify Identity',
      color: user.kycStatus === 'verified' ? 'text-emerald-500' : 'text-amber-500',
      link: '/kyc',
      value: user.kycStatus === 'verified' ? 'Verified' : (user.kycStatus === 'pending' ? 'Pending' : 'Action Required'),
      description: 'KYC and document verification'
    });
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-12">

        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 bg-zinc-900 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl overflow-hidden">
              {user?.name?.[0] || 'U'}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-white border border-zinc-100 rounded-full shadow-lg hover:bg-zinc-50 transition-all">
              <Camera className="h-5 w-5 text-black" />
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-black tracking-tight">{user?.name}</h1>
                <p className="text-zinc-500 font-medium">{user?.email}</p>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${isEditing ? 'bg-zinc-100 text-black' : 'bg-black text-white hover:bg-zinc-800'}`}
              >
                {isEditing ? <><X className="h-4 w-4" /> Cancel</> : <><Edit2 className="h-4 w-4" /> Edit Profile</>}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                {user?.role || 'Rider'}
              </span>
              {user?.role === 'driver' && (
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${user.kycStatus === 'verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  {user.kycStatus === 'verified' ? 'Verified' : 'Unverified'}
                </span>
              )}
              <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                {user?.loyaltyPoints || 0} Points
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 space-y-6"
            >
              <h2 className="text-2xl font-bold text-black">Edit Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="w-full p-4 bg-white rounded-2xl border border-zinc-100 outline-none focus:border-black transition-all font-bold"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    className="w-full p-4 bg-white rounded-2xl border border-zinc-100 outline-none focus:border-black transition-all font-bold"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input 
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    className="w-full p-4 bg-white rounded-2xl border border-zinc-100 outline-none focus:border-black transition-all font-bold"
                    placeholder="Enter your phone"
                  />
                </div>
              </div>
              <div className="pt-4">
                <button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="uber-btn-black w-full py-4 flex items-center justify-center gap-2"
                >
                  {saving ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="h-5 w-5" /> Save Changes</>}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="viewing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-black">Personal Information</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Mail className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email</p>
                      <p className="font-bold text-black">{user?.email}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Phone className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Phone</p>
                      <p className="font-bold text-black">{user?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>


                <div className="pt-6 space-y-4">
                  <h3 className="text-xl font-bold text-black">Saved Places</h3>
                  <div className="space-y-3">
                    {savedPlaces.length === 0 ? (
                      <p className="text-sm text-zinc-400 italic">No saved places yet.</p>
                    ) : (
                      savedPlaces.map((place) => (
                        <div key={place._id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between group hover:border-black transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <MapPin className="h-5 w-5 text-black" />
                            </div>
                            <div>
                              <p className="font-bold text-black">{place.name}</p>
                              <p className="text-xs text-zinc-400 line-clamp-1">{place.address}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeletePlace(place._id)}
                            className="p-2 text-zinc-300 hover:text-rose-500 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>


              <div className="space-y-6">
                <h3 className="text-xl font-bold text-black">Account Settings</h3>
                <div className="space-y-3">
                  {menuItems.map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => item.link && navigate(item.link)}
                      className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 rounded-2xl border border-transparent hover:border-zinc-100 transition-all group text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center group-hover:bg-white transition-all shadow-sm">
                          <item.icon className={`h-6 w-6 ${item.color}`} />
                        </div>
                        <div>
                          <span className="font-bold text-black block">{item.label}</span>
                          <span className="text-xs text-zinc-400">{item.description}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.value && (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.color.includes('emerald') ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                {item.value}
                            </span>
                        )}
                        <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-black transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        <div className="pt-12 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-rose-500 font-bold hover:underline"
          >
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
          <p className="text-xs text-zinc-400 font-medium">RideDeck v1.0.0 • Made with ❤️ for the road</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;

