import React from 'react';
import { motion } from 'framer-motion';
import { Tag, Ticket, Clock, ChevronRight, Gift, Star, ArrowRight } from 'lucide-react';

const Deals = () => {
  const offers = [
    {
      id: 1,
      title: '50% Off First 3 Rides',
      code: 'WELCOME50',
      desc: 'Get 50% discount on your first three rides with RideDeck.',
      expiry: 'Ends in 2 days',
      type: 'Ride',
      color: 'bg-zinc-900'
    },
    {
      id: 2,
      title: '₹100 Cashback on Wallet',
      code: 'WALLET100',
      desc: 'Add ₹1000 or more to your wallet and get ₹100 extra.',
      expiry: 'Ends in 5 days',
      type: 'Wallet',
      color: 'bg-emerald-600'
    },
    {
      id: 3,
      title: 'Free Ride Upgrade',
      code: 'PREMIERUP',
      desc: 'Upgrade your next Go ride to Premier for free.',
      expiry: 'Ends in 1 day',
      type: 'Upgrade',
      color: 'bg-blue-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-6 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-black tracking-tight">Exclusive Offers</h1>
          <p className="text-zinc-500 font-medium max-w-md mx-auto">
            Save more on every journey with our curated deals and promotions.
          </p>
        </div>

        {/* Featured Deal */}
        <div className="bg-zinc-900 rounded-[3rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl group cursor-pointer">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Gift className="h-64 w-64" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-6 text-center md:text-left">
              <span className="px-4 py-1.5 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-md">
                Featured Offer
              </span>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">Refer a friend, <br />get ₹500</h2>
              <p className="text-zinc-400 font-medium max-w-sm">
                Earn rewards for every friend who joins and takes their first ride.
              </p>
              <button className="uber-btn-white py-4 px-8 text-lg flex items-center gap-2 mx-auto md:mx-0">
                Invite Friends <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <div className="hidden lg:block">
              <div className="w-64 h-64 bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center backdrop-blur-sm">
                <Star className="h-32 w-32 text-white opacity-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offers.map((offer) => (
            <motion.div
              key={offer.id}
              whileHover={{ y: -10 }}
              className="bg-zinc-50 rounded-[2.5rem] border border-zinc-100 overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all"
            >
              <div className={`h-32 ${offer.color} p-8 flex items-end justify-between`}>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Ticket className="h-6 w-6 text-white" />
                </div>
                <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{offer.type}</span>
              </div>
              <div className="p-8 flex-1 flex flex-col space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-black">{offer.title}</h3>
                  <p className="text-sm text-zinc-500 font-medium line-clamp-2">{offer.desc}</p>
                </div>
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-bold">{offer.expiry}</span>
                  </div>
                  <button className="text-black font-bold hover:underline flex items-center gap-1">
                    Apply <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Promo Code Input */}
        <div className="max-w-xl mx-auto pt-12">
          <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 space-y-6 text-center">
            <h3 className="text-xl font-bold text-black">Have a promo code?</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter code"
                className="uber-input w-full pr-32"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 uber-btn-black py-2 px-6 text-sm">
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deals;
