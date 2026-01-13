import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Share2, 
  Copy, 
  CheckCircle, 
  Users, 
  Award, 
  ChevronRight,
  TrendingUp,
  Zap,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Referral = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ referralCode: '', referralCount: 0, loyaltyPoints: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralInput, setReferralInput] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/growth/referral`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) setStats(data);
    } catch (error) {
      toast.error('Failed to fetch referral stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(stats.referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Join RideDeck!',
      text: `Use my referral code ${stats.referralCode} to get 50 loyalty points on RideDeck!`,
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopy();
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleApplyReferral = async (e) => {
    e.preventDefault();
    if (!referralInput.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/growth/referral/apply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ code: referralInput.toUpperCase() }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setReferralInput('');
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to apply referral code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-50 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-10 md:p-16 rounded-[3rem] border-white/40 shadow-2xl mb-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest mb-6">
                <Gift className="h-4 w-4" />
                Refer & Earn
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
                Invite friends, <br />
                <span className="text-indigo-600">Earn Rewards.</span>
              </h1>
              <p className="text-lg font-bold text-slate-500 mb-8 max-w-md">
                Share your referral code with friends. When they join, you both get exclusive loyalty points!
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-auto flex items-center gap-4 px-6 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-2xl font-black text-slate-900 tracking-widest">{stats.referralCode}</span>
                  <button 
                    onClick={handleCopy}
                    className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-indigo-600"
                  >
                    {copied ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                <button 
                  onClick={handleShare}
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="h-5 w-5" />
                  Share Now
                </button>
              </div>
            </div>
            
            <div className="w-full md:w-72 space-y-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-2xl font-black text-slate-900">{stats.referralCount}</span>
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Referrals</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center">
                    <Award className="h-5 w-5 text-rose-600" />
                  </div>
                  <span className="text-2xl font-black text-slate-900">{stats.loyaltyPoints}</span>
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loyalty Points</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Apply Referral */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100"
          >
            <h3 className="text-2xl font-black text-slate-900 mb-2">Have a code?</h3>
            <p className="text-slate-500 font-bold mb-8">Enter your friend's referral code to unlock rewards.</p>
            
            <form onSubmit={handleApplyReferral} className="space-y-4">
              <input 
                type="text" 
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value)}
                placeholder="ENTER CODE"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black tracking-widest focus:outline-none focus:border-indigo-600 transition-all uppercase"
              />
              <button 
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                Apply Code
              </button>
            </form>
          </motion.div>

          {/* How it works */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100"
          >
            <h3 className="text-2xl font-black text-slate-900 mb-8">How it works</h3>
            <div className="space-y-6">
              {[
                { icon: Share2, title: 'Share your code', desc: 'Send your unique code to your friends.' },
                { icon: Zap, title: 'They join RideDeck', desc: 'Your friend signs up using your code.' },
                { icon: Star, title: 'Both get rewarded', desc: 'Earn loyalty points for every successful referral.' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                    <step.icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900">{step.title}</h4>
                    <p className="text-sm font-bold text-slate-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Referral;
