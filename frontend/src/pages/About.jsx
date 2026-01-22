import React from 'react';
import { motion } from 'framer-motion';
import { Car, Shield, Clock, Award, Users, Globe, Zap, Heart } from 'lucide-react';

const About = () => {
  const stats = [
    { label: 'Active Riders', value: '500K+', icon: Users },
    { label: 'Cities Covered', value: '50+', icon: Globe },
    { label: 'Total Rides', value: '2M+', icon: Car },
    { label: 'Driver Earnings', value: '₹100Cr+', icon: Award },
  ];

  const features = [
    {
      title: 'Zero Commission',
      desc: 'Our unique subscription model ensures drivers keep 100% of their hard-earned fare.',
      icon: Zap,
      color: 'bg-amber-100 text-amber-600'
    },
    {
      title: 'Safety First',
      desc: 'Real-time tracking, SOS alerts, and verified drivers for your peace of mind.',
      icon: Shield,
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      title: 'Reliability',
      desc: 'Advanced matching algorithms to ensure you get a ride when you need it most.',
      icon: Clock,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Community Driven',
      desc: 'Built with love for the road and the people who drive our cities forward.',
      icon: Heart,
      color: 'bg-rose-100 text-rose-600'
    }
  ];

  return (
    <div className="pt-32 min-h-screen bg-white">

      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-7xl font-black text-black leading-[1.1] mb-8">
              Redefining the way the world <span className="text-zinc-400">moves.</span>
            </h1>
            <p className="text-xl text-zinc-500 font-medium leading-relaxed mb-10">
              RideDeck is more than just a ride-sharing app. We're a technology company dedicated to creating a fairer, safer, and more efficient transportation ecosystem for everyone.
            </p>
            <div className="flex gap-4">
              <div className="px-6 py-3 bg-zinc-100 rounded-full text-sm font-bold text-black">Since 2024</div>
              <div className="px-6 py-3 bg-zinc-100 rounded-full text-sm font-bold text-black">Made in India</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-square bg-zinc-50 rounded-[3rem] overflow-hidden shadow-2xl">
              <img 
                src="/images/home_hero.png" 
                alt="About RideDeck" 
                className="w-full h-full object-cover opacity-80"
              />
            </div>
            <div className="absolute -bottom-8 -left-8 p-8 bg-black text-white rounded-[2rem] shadow-2xl hidden md:block">
              <p className="text-3xl font-black mb-1">100%</p>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Driver Earnings</p>
            </div>
          </motion.div>
        </div>
      </div>


      <div className="bg-zinc-50 py-24 mb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {stats.map((stat, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <stat.icon className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-4xl font-black text-black">{stat.value}</p>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-32">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-black text-black mb-6">Our Mission</h2>
          <p className="text-lg text-zinc-500 font-medium">
            To empower drivers and provide riders with a premium, reliable, and transparent experience through innovative technology and a community-first approach.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="p-8 bg-white rounded-[2.5rem] border border-zinc-100 hover:border-black transition-all group">
              <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform`}>
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-black text-black mb-4">{feature.title}</h3>
              <p className="text-zinc-500 font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-32">
        <div className="bg-black rounded-[4rem] p-12 lg:p-24 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
             <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-zinc-500 rounded-full blur-[120px]"></div>
          </div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-black mb-8">Ready to join the revolution?</h2>
            <p className="text-xl text-zinc-400 font-medium mb-12">
              Whether you're a rider looking for a better way to move or a driver wanting to earn more, RideDeck is for you.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button className="px-12 py-5 bg-white text-black rounded-full font-black text-lg hover:bg-zinc-100 transition-all">
                Get Started
              </button>
              <button className="px-12 py-5 bg-zinc-900 text-white rounded-full font-black text-lg border border-zinc-800 hover:bg-zinc-800 transition-all">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
