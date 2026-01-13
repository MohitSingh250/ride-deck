import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Clock, CheckCircle, ChevronRight, Star, Tag, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Deals = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/brands/my-offers`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await response.json();
        setOffers(data);
      } catch (error) {
        console.error('Error fetching offers:', error);
        toast.error('Failed to load deals');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchOffers();
  }, [user, API_URL]);

  const filteredOffers = offers.filter(offer => 
    activeTab === 'active' ? offer.status === 'active' : offer.status !== 'active'
  );

  return (
    <div className="pt-32 min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">Your Rewards</h1>
            <p className="text-lg font-bold text-slate-400">Exclusive deals from our brand partners.</p>
          </div>
          
          <div className="flex bg-white p-2 rounded-2xl shadow-xl border border-slate-100">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'accent-gradient text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'accent-gradient text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              History
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-white/50 rounded-[3rem] animate-pulse border border-white/60"></div>
            ))}
          </div>
        ) : filteredOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredOffers.map((offer, index) => (
                <motion.div
                  key={offer._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass p-8 rounded-[3rem] border-white/40 shadow-2xl hover:shadow-indigo-100/50 transition-all group"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="h-20 w-20 rounded-[1.5rem] bg-white p-4 shadow-inner border border-slate-100 transform group-hover:rotate-3 transition-transform duration-500">
                      <img src={offer.brandId.logo} alt={offer.brandId.name} className="h-full w-full object-contain" />
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${offer.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                      {offer.status}
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{offer.brandId.name}</h3>
                    <p className="text-lg font-bold text-slate-600 leading-tight">{offer.offerText}</p>
                    
                    {offer.status === 'active' && (
                      <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between group/code">
                        <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Promo Code</p>
                          <p className="text-xl font-black text-indigo-600 tracking-wider">{offer.discountCode}</p>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(offer.discountCode);
                            toast.success('Code copied!');
                          }}
                          className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                          <Tag className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-bold">Expires {new Date(offer.expiryDate).toLocaleDateString()}</span>
                    </div>
                    <a 
                      href="#" 
                      className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:accent-gradient transition-all group-hover:scale-110"
                      onClick={(e) => e.preventDefault()}
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="glass rounded-[4rem] p-24 text-center border-white/40 shadow-2xl">
            <div className="h-24 w-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Tag className="h-12 w-12 text-indigo-300" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-3">No rewards yet</h3>
            <p className="text-lg font-bold text-slate-400 mb-10 max-w-md mx-auto">Take more rides to unlock exclusive deals from brands near your route!</p>
            <button 
              onClick={() => window.history.back()}
              className="accent-gradient text-white px-12 py-5 rounded-2xl font-black hover:scale-105 transition-all shadow-2xl shadow-indigo-100 uppercase tracking-widest"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Security Note */}
        <div className="flex items-center justify-center gap-3 text-slate-400 py-10">
          <ShieldCheck className="h-5 w-5" />
          <p className="text-sm font-bold uppercase tracking-widest">Rewards are verified and secure</p>
        </div>
      </div>
    </div>
  );
};

export default Deals;
