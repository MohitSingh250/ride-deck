import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Banknote, ArrowUpRight, ArrowDownLeft, Plus, ChevronRight, History, Shield, Wallet as WalletIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const Wallet = () => {
  const [balance, setBalance] = useState(1250);
  const [showAddFunds, setShowAddFunds] = useState(false);

  const transactions = [
    { id: 'TX-9283', type: 'debit', amount: '₹450', title: 'Ride to Airport', date: 'Today, 2:45 PM' },
    { id: 'TX-9120', type: 'credit', amount: '₹500', title: 'Referral Bonus', date: 'Yesterday, 10:15 AM' },
    { id: 'TX-8945', type: 'debit', amount: '₹320', title: 'Ride to Cyber Hub', date: 'Jan 12, 2026' }
  ];

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Balance Card */}
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

        {/* Quick Actions */}
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

        {/* Transaction History */}
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
    </div>
  );
};

export default Wallet;
