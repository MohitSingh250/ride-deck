import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, History, CreditCard, Landmark, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Wallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: user?.bankAccount?.accountNumber || '',
    ifscCode: user?.bankAccount?.ifscCode || '',
    bankName: user?.bankAccount?.bankName || '',
    holderName: user?.bankAccount?.holderName || ''
  });
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [topupAmount, setTopupAmount] = useState('');
  const [showTopupModal, setShowTopupModal] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const fetchWalletData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wallet/history`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setBalance(data.balance);
        setLoyaltyPoints(data.loyaltyPoints || 0);
        setTransactions(data.transactions);
      }
    } catch (error) {
      toast.error('Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleTopup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/wallet/topup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ amount: topupAmount }),
      });
      const data = await response.json();
      if (response.ok) {
        setBalance(data.balance);
        setShowTopupModal(false);
        setTopupAmount('');
        toast.success('Wallet topped up successfully!');
        fetchWalletData();
      }
    } catch (error) {
      toast.error('Top-up failed');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (Number(withdrawAmount) > balance) {
      toast.error('Insufficient balance');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/wallet/withdraw`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ amount: withdrawAmount }),
      });
      const data = await response.json();
      if (response.ok) {
        setBalance(data.balance);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        toast.success('Withdrawal request submitted!');
        fetchWalletData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Withdrawal failed');
    }
  };

  const handleUpdateBank = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/wallet/bank-account`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(bankDetails),
      });
      if (response.ok) {
        toast.success('Bank account updated successfully!');
        setShowBankModal(false);
      }
    } catch (error) {
      toast.error('Failed to update bank account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-900 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">My Wallet</h1>
            <p className="text-slate-400">Manage your earnings and payments</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTopupModal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="h-5 w-5" />
            Add Money
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Balance Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <WalletIcon size={120} />
              </div>
              <div className="relative z-10">
                <p className="text-indigo-100 font-medium mb-2 uppercase tracking-wider">Available Balance</p>
                <h2 className="text-5xl font-black mb-8">₹{balance.toLocaleString()}</h2>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex-1">
                    <p className="text-xs text-indigo-100 mb-1">Status</p>
                    <p className="font-bold">Active</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex-1">
                    <p className="text-xs text-indigo-100 mb-1">Currency</p>
                    <p className="font-bold">INR</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Loyalty Points Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-8 bg-slate-800/50 border border-slate-700/50 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Award className="h-24 w-24 text-indigo-500" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                    <Award className="h-5 w-5 text-indigo-500" />
                  </div>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loyalty Points</p>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <h3 className="text-4xl font-black text-white">{loyaltyPoints}</h3>
                  <p className="text-slate-500 font-bold mb-1">pts</p>
                </div>
                <p className="text-xs font-bold text-slate-500">Earn 10% points on every ride</p>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div 
                onClick={() => setShowWithdrawModal(true)}
                className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-3xl hover:bg-slate-800 transition-colors cursor-pointer group"
              >
                <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Landmark className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-white font-bold">Withdraw</h3>
                <p className="text-slate-400 text-sm">To bank account</p>
              </div>
              <div 
                onClick={() => setShowBankModal(true)}
                className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-3xl hover:bg-slate-800 transition-colors cursor-pointer group"
              >
                <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-6 w-6 text-indigo-500" />
                </div>
                <h3 className="text-white font-bold">Bank</h3>
                <p className="text-slate-400 text-sm">Link account</p>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-[2.5rem] p-8 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                    <History className="h-5 w-5 text-indigo-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Recent Transactions</h2>
                </div>
                <button className="text-indigo-400 hover:text-indigo-300 font-bold text-sm">View All</button>
              </div>

              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="h-10 w-10 text-slate-500" />
                    </div>
                    <p className="text-slate-400">No transactions yet</p>
                  </div>
                ) : (
                  transactions.map((tx, index) => (
                    <motion.div
                      key={tx._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-700/30 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                          tx.type === 'credit' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                        }`}>
                          {tx.type === 'credit' ? (
                            <ArrowDownLeft className={`h-6 w-6 ${tx.type === 'credit' ? 'text-emerald-500' : 'text-red-500'}`} />
                          ) : (
                            <ArrowUpRight className={`h-6 w-6 ${tx.type === 'credit' ? 'text-emerald-500' : 'text-red-500'}`} />
                          )}
                        </div>
                        <div>
                          <h4 className="text-white font-bold capitalize">{tx.category.replace('_', ' ')}</h4>
                          <p className="text-slate-400 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-black ${
                          tx.type === 'credit' ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                        </p>
                        <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">{tx.status}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Topup Modal */}
      <AnimatePresence>
        {showTopupModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTopupModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white mb-2">Add Money</h2>
              <p className="text-slate-400 mb-8">Enter the amount you want to add to your wallet</p>
              
              <form onSubmit={handleTopup}>
                <div className="relative mb-8">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-500">₹</span>
                  <input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-6 pl-12 pr-6 text-3xl font-black text-white focus:border-indigo-500 focus:outline-none transition-all"
                    required
                  />
                </div>
                
                <div className="mb-8">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Select Payment Method</p>
                  <div className="grid grid-cols-3 gap-3">
                    {['upi', 'card', 'cash'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-3 rounded-xl font-bold border transition-all ${
                          paymentMethod === method 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {method.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[500, 1000, 2000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(amt.toString())}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors border border-slate-700"
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowTopupModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Confirm
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white mb-2">Withdraw Money</h2>
              <p className="text-slate-400 mb-8">Enter the amount you want to withdraw to your bank account</p>
              
              <form onSubmit={handleWithdraw}>
                <div className="relative mb-8">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-500">₹</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-6 pl-12 pr-6 text-3xl font-black text-white focus:border-indigo-500 focus:outline-none transition-all"
                    required
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Withdraw
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bank Account Modal */}
      <AnimatePresence>
        {showBankModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBankModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white mb-2">Bank Account</h2>
              <p className="text-slate-400 mb-8">Link your bank account for withdrawals</p>
              
              <form onSubmit={handleUpdateBank} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Account Holder Name</label>
                  <input
                    type="text"
                    value={bankDetails.holderName}
                    onChange={(e) => setBankDetails({...bankDetails, holderName: e.target.value})}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl py-4 px-6 text-white focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Account Number</label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl py-4 px-6 text-white focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="000000000000"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">IFSC Code</label>
                    <input
                      type="text"
                      value={bankDetails.ifscCode}
                      onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                      className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl py-4 px-6 text-white focus:border-indigo-500 focus:outline-none transition-all"
                      placeholder="SBIN0001234"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Bank Name</label>
                    <input
                      type="text"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                      className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl py-4 px-6 text-white focus:border-indigo-500 focus:outline-none transition-all"
                      placeholder="SBI"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBankModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-50 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Save Details
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
