import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Banknote, ArrowUpRight, ArrowDownLeft, Plus, ChevronRight, History, Shield, Wallet as WalletIcon, Tag, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const Wallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(1250);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [activeTab, setActiveTab] = useState('balance');
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    if (activeTab === 'coupons') {
      const fetchCoupons = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/brands/my-coupons`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setCoupons(data);
          }
        } catch (error) {
          console.error('Error fetching coupons:', error);
        }
      };
      fetchCoupons();
    }
  }, [activeTab, user.token]);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied!');
  };

  const transactions = [
    { id: 'TX-9283', type: 'debit', amount: '₹450', title: 'Ride to Airport', date: 'Today, 2:45 PM' },
    { id: 'TX-9120', type: 'credit', amount: '₹500', title: 'Referral Bonus', date: 'Yesterday, 10:15 AM' },
    { id: 'TX-8945', type: 'debit', amount: '₹320', title: 'Ride to Cyber Hub', date: 'Jan 12, 2026' }
  ];

  const [selectedCoupon, setSelectedCoupon] = useState(null);

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="flex p-1 bg-zinc-100 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('balance')}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'balance' ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-black'}`}
          >
            Balance & Transactions
          </button>
          <button 
            onClick={() => setActiveTab('coupons')}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'coupons' ? 'bg-white shadow-sm text-black' : 'text-zinc-500 hover:text-black'}`}
          >
            My Coupons
          </button>
        </div>

        {activeTab === 'balance' ? (
          <div className="space-y-12">

        <div className="bg-zinc-900 rounded-[3rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <WalletIcon className="h-48 w-48" />
          </div>
          <div className="relative z-10 space-y-8">
            <div>
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Balance</p>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter">₹{balance}</h1>
            </div>
            <div className="flex flex-wrap gap-4">
              <button className="uber-btn-white py-4 px-8 text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" /> Add Funds
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white py-4 px-8 rounded-2xl text-lg font-bold transition-all flex items-center gap-2 backdrop-blur-md">
                <ArrowUpRight className="h-5 w-5" /> Withdraw
              </button>
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 space-y-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <CreditCard className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-xl font-bold text-black">Payment Methods</h3>
            <p className="text-sm text-zinc-500 font-medium">Manage your cards and linked accounts for seamless payments.</p>
            <button className="text-black font-bold hover:underline flex items-center gap-1 pt-2">
              Manage methods <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 space-y-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Shield className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-xl font-bold text-black">Auto-Refill</h3>
            <p className="text-sm text-zinc-500 font-medium">Never run out of balance. Automatically top up when balance is low.</p>
            <button className="text-black font-bold hover:underline flex items-center gap-1 pt-2">
              Set up auto-refill <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>


        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-black tracking-tight">Recent Transactions</h3>
            <button className="text-sm font-bold text-black hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            {transactions.map((tx, i) => (
              <div key={tx.id} className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-between hover:border-zinc-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
                    {tx.type === 'credit' ? <ArrowDownLeft className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-black">{tx.title}</p>
                    <p className="text-xs text-zinc-500 font-medium">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-black'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                  </p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{tx.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
          </div>
        ) : (
          <div className="space-y-6">
            {coupons.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="h-8 w-8 text-zinc-400" />
                </div>
                <h3 className="text-xl font-bold text-black">No coupons yet</h3>
                <p className="text-zinc-500 mt-2">Ride more to discover exclusive brand offers!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coupons.map((coupon) => (
                  <div key={coupon._id} className="bg-white rounded-3xl p-6 relative overflow-hidden group hover:shadow-2xl transition-all border border-zinc-100 ring-1 ring-black/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
                    
                    <div className="relative z-10 flex items-start gap-5">
                      <div className="w-20 h-20 bg-white rounded-2xl p-3 shadow-sm border border-zinc-100 flex items-center justify-center">
                        <img 
                          src={coupon.campaignId.brandId.logo} 
                          alt={coupon.campaignId.brandId.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-zinc-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-zinc-200">
                              {coupon.campaignId.brandId.category}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-black leading-tight mb-1 truncate">{coupon.campaignId.title}</h3>
                          <p className="text-sm text-zinc-500 line-clamp-2">{coupon.campaignId.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-zinc-50 border border-zinc-200 border-dashed rounded-xl p-3 flex items-center justify-between group-hover:bg-white group-hover:border-zinc-300 transition-colors">
                            <code className="font-mono font-bold text-lg text-black tracking-wider">{coupon.code}</code>
                            <button 
                              onClick={() => copyToClipboard(coupon.code)}
                              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-black"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          <button 
                            onClick={() => setSelectedCoupon(coupon)}
                            className="p-3 bg-black text-white rounded-xl hover:bg-zinc-800 transition-colors shadow-lg shadow-black/10"
                          >
                            <ArrowUpRight className="h-5 w-5" />
                          </button>
                        </div>
                        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider mt-3 text-right">
                          Saved {new Date(coupon.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>


      {selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCoupon(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-white rounded-2xl p-2 shadow-sm border border-zinc-100 mx-auto">
                <img 
                  src={selectedCoupon.campaignId.brandId.logo} 
                  alt={selectedCoupon.campaignId.brandId.name}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-black">{selectedCoupon.campaignId.brandId.name}</h3>
                <p className="text-zinc-500">{selectedCoupon.campaignId.title}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border-2 border-zinc-100 inline-block">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedCoupon.code}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>

              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 border-dashed">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Coupon Code</p>
                <p className="text-2xl font-mono font-bold text-black tracking-widest">{selectedCoupon.code}</p>
              </div>

              <p className="text-xs text-zinc-400">Scan this code at the store to redeem your offer.</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
