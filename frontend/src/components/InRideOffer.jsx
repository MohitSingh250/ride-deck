import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, ShoppingBag } from 'lucide-react';
import confetti from 'canvas-confetti';

const InRideOffer = ({ campaign, onSave, onDismiss }) => {
  if (!campaign) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.9 }}
        className="fixed bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] z-50"
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 ring-1 ring-black/5">
          <div className="relative h-40">
            <img 
              src={campaign.brandId.logo} 
              alt={campaign.brandId.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <button 
              onClick={onDismiss}
              className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all border border-white/10"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-4 left-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                  {campaign.brandId.category}
                </span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight">{campaign.brandId.name}</h3>
            </div>
          </div>
          
          <div className="p-5 space-y-4">
            <div>
              <h4 className="font-bold text-xl text-black leading-tight mb-2">{campaign.title}</h4>
              <p className="text-sm text-zinc-600 leading-relaxed">{campaign.description}</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Code</span>
              <span className="font-mono font-bold text-lg text-black tracking-widest">{campaign.code}</span>
            </div>

            <button 
              onClick={(e) => {
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  zIndex: 9999
                });
                onSave(campaign._id);
              }}
              className="w-full py-4 bg-black text-white rounded-xl font-bold text-sm hover:bg-zinc-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-[0.98]"
            >
              <Tag className="h-4 w-4" /> 
              Save to Wallet
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InRideOffer;
