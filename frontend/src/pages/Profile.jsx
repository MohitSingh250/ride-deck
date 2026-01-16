import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Shield, CreditCard, Gift, LogOut, ChevronRight, Camera, Edit2, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const menuItems = [
    { icon: CreditCard, label: 'Payment Methods', color: 'text-zinc-400' },
    { icon: Shield, label: 'Safety & Security', color: 'text-zinc-400' },
    { icon: Gift, label: 'Refer & Earn', color: 'text-zinc-400', link: '/referral' },
    { icon: MapPin, label: 'Saved Places', color: 'text-zinc-400' },
  ];

  if (user?.role === 'driver') {
    menuItems.unshift({
      icon: user.kycStatus === 'verified' ? CheckCircle : AlertTriangle,
      label: 'Verify Identity',
      color: user.kycStatus === 'verified' ? 'text-emerald-500' : 'text-amber-500',
      link: '/kyc',
      value: user.kycStatus === 'verified' ? 'Verified' : (user.kycStatus === 'pending' ? 'Pending' : 'Action Required')
    });
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 bg-zinc-900 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
              {user?.name?.[0] || 'U'}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-white border border-zinc-100 rounded-full shadow-lg hover:bg-zinc-50 transition-all opacity-0 group-hover:opacity-100">
              <Camera className="h-5 w-5 text-black" />
            </button>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold text-black tracking-tight">{user?.name}</h1>
            <p className="text-zinc-500 font-medium">{user?.email}</p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-xs font-bold uppercase tracking-widest rounded-full">
                {user?.role || 'Rider'}
              </span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-widest rounded-full">
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Info */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-black">Personal Information</h3>
              <button onClick={() => setIsEditing(!isEditing)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                <Edit2 className="h-4 w-4 text-black" />
              </button>
            </div>
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
          </div>

          {/* Account Settings */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-black">Account Settings</h3>
            <div className="space-y-2">
              {menuItems.map((item, i) => (
                <button 
                  key={i} 
                  onClick={() => item.link && navigate(item.link)}
                  className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-white transition-all">
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <span className="font-bold text-black">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.color.includes('emerald') ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {item.value}
                        </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-black transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-12 border-t border-zinc-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-rose-500 font-bold hover:underline"
          >
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
