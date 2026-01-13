import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, MessageCircle, Phone, Mail, ChevronRight, Search, Shield, CreditCard, User, Navigation } from 'lucide-react';

const Help = () => {
  const categories = [
    { icon: User, title: 'Account & Profile', desc: 'Manage your personal info and settings' },
    { icon: Navigation, title: 'Rides & Trips', desc: 'Issues with a ride or trip details' },
    { icon: CreditCard, title: 'Payments & Pricing', desc: 'Billing, refunds, and fare estimates' },
    { icon: Shield, title: 'Safety & Security', desc: 'Your safety is our top priority' },
  ];

  const faqs = [
    { q: 'How do I book a ride?', a: 'Simply enter your pickup and dropoff locations on the dashboard and choose your preferred vehicle type.' },
    { q: 'What is the zero-commission model?', a: 'Drivers pay a flat subscription fee instead of a percentage commission, keeping 100% of their earnings.' },
    { q: 'How do I become a driver?', a: 'Sign up as a driver, provide your vehicle details, and choose a subscription plan to start earning.' },
    { q: 'Is my data secure?', a: 'Yes, we use industry-standard encryption to protect your personal and payment information.' },
  ];

  return (
    <div className="pt-32 min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16 pb-20">
        {/* Header */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200 transform -rotate-6"
          >
            <HelpCircle className="h-12 w-12" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">How can we help?</h1>
            <p className="text-xl font-bold text-slate-400">Search our knowledge base or contact support.</p>
          </div>
          
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search for topics, issues, or keywords..."
              className="block w-full pl-16 pr-8 py-6 bg-white rounded-[2rem] border-2 border-transparent shadow-2xl shadow-slate-200/50 focus:outline-none focus:border-indigo-600 transition-all font-bold text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-8 rounded-[2.5rem] border-white/40 shadow-xl hover:shadow-indigo-100/50 transition-all cursor-pointer group"
            >
              <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <cat.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">{cat.title}</h3>
              <p className="text-sm font-bold text-slate-400 leading-relaxed">{cat.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* FAQs */}
        <div className="glass p-10 rounded-[3.5rem] shadow-2xl border-white/40 space-y-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="space-y-3 p-6 rounded-3xl hover:bg-white/50 transition-colors">
                <h4 className="text-lg font-black text-slate-900">{faq.q}</h4>
                <p className="text-base font-bold text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: MessageCircle, title: 'Live Chat', detail: 'Average wait: 2 mins', color: 'bg-emerald-50 text-emerald-600' },
            { icon: Phone, title: 'Call Us', detail: '+1 (800) RIDE-DECK', color: 'bg-indigo-50 text-indigo-600' },
            { icon: Mail, title: 'Email Support', detail: 'support@ridedeck.com', color: 'bg-purple-50 text-purple-600' },
          ].map((item, index) => (
            <div key={index} className="glass p-8 rounded-[2.5rem] border-white/40 shadow-xl flex flex-col items-center text-center gap-4 hover:shadow-2xl transition-all">
              <div className={`h-16 w-16 ${item.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                <item.icon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{item.title}</h3>
                <p className="text-sm font-bold text-slate-400">{item.detail}</p>
              </div>
              <button className="mt-2 text-indigo-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                Contact <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Help;
