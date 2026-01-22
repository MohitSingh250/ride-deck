import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Share2, Copy, CheckCircle, Users, Award, ChevronRight, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Referral = () => {
  const [copied, setCopied] = useState(false);
  const referralCode = "RIDEDECK500";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-12">

        <div className="bg-zinc-900 rounded-[3rem] p-8 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-400 via-zinc-900 to-black" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-12">
              <Gift className="h-10 w-10 text-black" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">Refer & Earn ₹500</h1>
            <p className="text-zinc-400 font-medium max-w-md mx-auto">
              Share the RideDeck experience with your friends and earn rewards for every successful referral.
            </p>
          </div>
        </div>


        <div className="max-w-md mx-auto space-y-4">
          <p className="text-center text-sm font-bold text-zinc-400 uppercase tracking-widest">Your Referral Code</p>
          <div className="p-2 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-between">
            <span className="px-6 text-2xl font-black text-black tracking-widest">{referralCode}</span>
            <button 
              onClick={handleCopy}
              className="uber-btn-black py-3 px-6 rounded-xl flex items-center gap-2"
            >
              {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
          {[
            { icon: Share2, title: 'Share Link', desc: 'Send your unique referral link to friends.' },
            { icon: Users, title: 'Friends Join', desc: 'Your friends sign up and take their first ride.' },
            { icon: Award, title: 'Get Rewarded', desc: 'Receive ₹500 in your wallet for each friend.' },
          ].map((step, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto border border-zinc-100 shadow-sm">
                <step.icon className="h-8 w-8 text-black" />
              </div>
              <h3 className="font-bold text-black">{step.title}</h3>
              <p className="text-sm text-zinc-500 font-medium">{step.desc}</p>
            </div>
          ))}
        </div>


        <div className="pt-12 border-t border-zinc-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-black tracking-tight">Referral History</h3>
            <button className="text-sm font-bold text-black hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Rahul S.', status: 'Completed', amount: '₹500', date: 'Jan 12, 2026' },
              { name: 'Priya K.', status: 'Pending', amount: '₹0', date: 'Jan 14, 2026' },
            ].map((ref, i) => (
              <div key={i} className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-bold text-black shadow-sm">
                    {ref.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-black">{ref.name}</p>
                    <p className="text-xs text-zinc-500 font-medium">{ref.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${ref.status === 'Completed' ? 'text-emerald-600' : 'text-amber-500'}`}>{ref.status}</p>
                  <p className="font-bold text-black">{ref.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referral;
