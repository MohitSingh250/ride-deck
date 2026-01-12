import React, { useState } from 'react';
import { ArrowRight, Clock, MapPin, Shield, Star, Smartphone, Globe, Navigation, Banknote, Calendar, ShieldCheck, User, Car } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');

  const isDriver = user?.role === 'driver';

  const handleSeePrices = (e) => {
    e.preventDefault();
    if (user) {
        navigate(user.role === 'driver' ? '/driver-dashboard' : '/rider-dashboard');
    } else {
        navigate('/login');
    }
  };

  // --- PUBLIC LANDING PAGE (Not Logged In) ---
  if (!user) {
    return (
        <div className="pt-20 min-h-screen bg-slate-50 font-sans overflow-hidden">
            {/* High-Impact Hero Section */}
            <div className="relative min-h-[95vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
                {/* Background Elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] opacity-60 animate-pulse-slow"></div>
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-100 rounded-full blur-[100px] opacity-40"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center lg:text-left"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">The Future of Mobility</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8">
                            Ride the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Revolution.</span>
                        </h1>
                        
                        <p className="text-xl text-slate-500 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            Experience the next generation of ride-hailing. Zero commission for drivers, premium experience for riders. Transparent, fast, and reliable.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <Link 
                                to="/signup" 
                                className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all transform hover:-translate-y-1 shadow-2xl shadow-indigo-200 flex items-center justify-center group"
                            >
                                Get Started Now
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link 
                                to="/login" 
                                className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border border-slate-200 font-black rounded-2xl hover:bg-slate-50 transition-all transform hover:-translate-y-1 shadow-sm flex items-center justify-center"
                            >
                                Sign In
                            </Link>
                        </div>

                        <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-slate-900">10M+</span>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Riders</span>
                            </div>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-slate-900">500K+</span>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Drivers</span>
                            </div>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-slate-900">100%</span>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Commission Free</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative z-10 bg-white p-4 rounded-[3rem] shadow-2xl border border-slate-100 transform hover:scale-[1.02] transition-transform duration-500">
                            <img 
                                src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0" 
                                alt="Premium Ride" 
                                className="w-full h-[600px] object-cover rounded-[2.5rem]" 
                            />
                            {/* Floating Stats Card */}
                            <div className="absolute -bottom-10 -left-10 glass p-6 rounded-3xl animate-bounce-slow">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                                        <Banknote className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Earnings Today</p>
                                        <p className="text-2xl font-black text-slate-900">$428.50</p>
                                    </div>
                                </div>
                            </div>
                            {/* Floating User Card */}
                            <div className="absolute -top-10 -right-10 glass p-6 rounded-3xl animate-pulse-slow">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <Star className="h-6 w-6 fill-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Rated</p>
                                        <p className="text-2xl font-black text-slate-900">4.98</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative Rings */}
                        <div className="absolute -inset-10 border-2 border-indigo-100 rounded-[4rem] -z-10 animate-pulse-slow"></div>
                        <div className="absolute -inset-20 border border-purple-50 rounded-[5rem] -z-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                    </motion.div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-32 bg-white relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-24">
                        <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Why RideDeck</h2>
                        <h3 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Built for the modern world.</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: ShieldCheck, title: "Safety First", desc: "Every ride is tracked and every driver is verified for your peace of mind.", color: "bg-blue-50 text-blue-600" },
                            { icon: Banknote, title: "Fair Pricing", desc: "No hidden fees or surge pricing. Just honest, transparent fares every time.", color: "bg-green-50 text-green-600" },
                            { icon: Globe, title: "Global Reach", desc: "Available in over 500 cities worldwide, ready whenever you are.", color: "bg-purple-50 text-purple-600" }
                        ].map((feature, i) => (
                            <motion.div 
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-transparent transition-all duration-300"
                            >
                                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 shadow-sm`}>
                                    <feature.icon className="h-8 w-8" />
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h4>
                                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // --- LOGGED IN USER VIEW (Driver or Rider) ---
  return (
    <div className="pt-16 min-h-screen bg-white font-sans">
      {/* Unique Hero Section: Overlapping Card Layout */}
      <div className="relative bg-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gray-800 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gray-900 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative bg-white pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
            {/* Background Illustration */}
            <div className="absolute inset-0 z-0 opacity-10">
                <img 
                    src="https://images.unsplash.com/photo-1758708312845-91ebc394cf27?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDZ8fGlsbHVzdHJhdGlvbiUyMG1pbmltYWxpc3R8ZW58MHx8MHx8fDA%3D" 
                    alt="Background" 
                    className="w-full h-full object-cover" 
                />
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-black mb-6 leading-tight"
                    >
                        {isDriver ? (
                            <>
                                Drive when you want,<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-black">make what you need.</span>
                            </>
                        ) : (
                            <>
                                Go anywhere,<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-black">get anything.</span>
                            </>
                        )}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-gray-500 mb-8 px-4"
                    >
                        {isDriver 
                            ? "Earn on your own schedule. No boss, no limits. Just you and the open road."
                            : "Request a ride, hop in, and go. Reliable, safe, and always ready when you are."
                        }
                    </motion.p>
                </div>
            </div>
        </div>

        {/* Floating Widget (Booking for Rider / Dashboard for Driver) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-12 sm:-mt-24 lg:-mt-32">
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100">
                {isDriver ? (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-left">
                            <h3 className="text-2xl font-bold text-black mb-2">Welcome back, {user.name} 👋</h3>
                            <p className="text-gray-500">Ready to hit the road? Go online now to start earning.</p>
                        </div>
                        <Link 
                            to="/driver-dashboard"
                            className="w-full md:w-auto bg-black text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all transform hover:-translate-y-1 shadow-lg flex items-center justify-center"
                        >
                            Go to Driver Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                ) : (
                    <div className="lg:flex lg:items-end lg:gap-6">
                        <div className="lg:flex-1 space-y-4 lg:space-y-0 lg:flex lg:gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pickup</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-black" />
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                        placeholder="Enter location"
                                        value={pickup}
                                        onChange={(e) => setPickup(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dropoff</label>
                                <div className="relative">
                                    <Navigation className="absolute left-3 top-3 h-5 w-5 text-black" />
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                        placeholder="Enter destination"
                                        value={dropoff}
                                        onChange={(e) => setDropoff(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleSeePrices}
                            className="w-full lg:w-auto mt-4 lg:mt-0 bg-black text-white px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all transform hover:-translate-y-1 shadow-lg"
                        >
                            See Prices
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Journey Timeline Section (3-Step Process) */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
                <h2 className="text-4xl font-black text-black mb-2">
                    {isDriver ? "Earn in 3 Easy Steps" : "Ride in 3 Easy Steps"}
                </h2>
                <p className="text-lg text-gray-500">Simple, fast, and transparent.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="group">
                    <div className="relative h-64 w-full bg-blue-50 rounded-3xl overflow-hidden mb-8 transition-transform transform group-hover:-translate-y-2 duration-300">
                        <div className="absolute inset-0 bg-blue-500 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <img 
                            src="/step_request_color.png" 
                            alt="Step 1" 
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-blue-600 shadow-md">1</div>
                    </div>
                    <h3 className="text-2xl font-bold text-black mb-3">
                        {isDriver ? "Go Online" : "Request a Ride"}
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                        {isDriver 
                            ? "Open the app and toggle your status to Online. You're now ready to receive ride requests."
                            : "Enter your destination, compare prices for different vehicles, and book the one that fits your needs."
                        }
                    </p>
                </div>

                {/* Step 2 */}
                <div className="group">
                    <div className="relative h-64 w-full bg-purple-50 rounded-3xl overflow-hidden mb-8 transition-transform transform group-hover:-translate-y-2 duration-300">
                        <div className="absolute inset-0 bg-purple-600 mix-blend-color z-10 opacity-60"></div>
                        <div className="absolute inset-0 bg-purple-100 z-0"></div>
                        <img 
                            src="/step_track.png" 
                            alt="Step 2" 
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 relative z-0 mix-blend-multiply" 
                        />
                        <div className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-purple-600 shadow-md z-20">2</div>
                    </div>
                    <h3 className="text-2xl font-bold text-black mb-3">
                        {isDriver ? "Accept & Drive" : "Match & Track"}
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                        {isDriver
                            ? "Get matched with nearby riders instantly. Navigate to the pickup location using the map."
                            : "Get matched with a nearby driver instantly. Track their real-time location on the map as they arrive."
                        }
                    </p>
                </div>

                {/* Step 3 */}
                <div className="group">
                    <div className="relative h-64 w-full bg-green-50 rounded-3xl overflow-hidden mb-8 transition-transform transform group-hover:-translate-y-2 duration-300">
                        <div className="absolute inset-0 bg-teal-600 mix-blend-color z-10 opacity-60"></div>
                        <div className="absolute inset-0 bg-teal-100 z-0"></div>
                        <img 
                            src="/step_ride.png" 
                            alt="Step 3" 
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 relative z-0 mix-blend-multiply" 
                        />
                        <div className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-teal-600 shadow-md z-20">3</div>
                    </div>
                    <h3 className="text-2xl font-bold text-black mb-3">
                        {isDriver ? "Earn & Cash Out" : "Hop in & Go"}
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                        {isDriver
                            ? "Complete the ride and get paid instantly. Track your daily earnings and cash out whenever you want."
                            : "Share your OTP, enjoy the ride, and pay seamlessly upon arrival. Rate your driver to keep our community safe."
                        }
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-black text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Loved by Millions</h2>
            <p className="text-xl text-gray-400">Don't just take our word for it.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sarah J.", role: "Rider", text: "RideDeck changed my daily commute. The drivers are always professional and the cars are spotless.", rating: 5 },
              { name: "Mike T.", role: "Driver", text: "I've doubled my earnings since switching to RideDeck. The instant payouts are a game changer.", rating: 5 },
              { name: "Priya K.", role: "Rider", text: "Safe, reliable, and affordable. I use it for all my late-night shifts and never worry about getting home.", rating: 5 }
            ].map((testimonial, i) => (
              <div key={i} className="bg-gray-900 p-8 rounded-3xl border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-lg text-gray-300 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-800 rounded-full flex items-center justify-center font-bold text-white">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-white">{testimonial.name}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Split Section */}
      <div className="py-16 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                <div className="order-2 lg:order-1">
                    <img 
                        src="/hero.png" 
                        alt="City Ride" 
                        className="w-full h-auto rounded-3xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500"
                    />
                </div>
                <div className="order-1 lg:order-2 mb-12 lg:mb-0">
                    <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                        {isDriver ? "Your roadmap to financial freedom." : "Reimagining urban mobility."}
                    </h2>
                    <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                        {isDriver
                            ? "We provide the tools, you provide the drive. With RideDeck, you're in the driver's seat of your career. Enjoy flexible hours, instant payouts, and a supportive community."
                            : "We're building a future where transportation is seamless, sustainable, and accessible to everyone. Whether you're commuting to work or exploring the city, RideDeck gets you there in style."
                        }
                    </p>
                    <ul className="space-y-4 mb-8">
                        {(isDriver 
                            ? ['Instant Payouts', 'Flexible Schedule', 'Driver Support & Rewards'] 
                            : ['Zero surge pricing', '24/7 Customer Support', 'In-app safety toolkit']
                        ).map((item, i) => (
                            <li key={i} className="flex items-center text-gray-700 font-medium">
                                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center mr-3">
                                    <ArrowRight className="h-3 w-3 text-white" />
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
      </div>

      {/* Account/CTA Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-black rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden">
                {/* Abstract Shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gray-800 rounded-full blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="relative z-10 lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                    <div className="mb-10 lg:mb-0">
                        {user ? (
                            <>
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                    {isDriver ? `Ready to earn, ${user.name}?` : `Ready to ride, ${user.name}?`}
                                </h2>
                                <p className="text-gray-400 text-lg mb-8">
                                    {isDriver 
                                        ? "Your next passenger is waiting. Go online and start earning today."
                                        : "Your next destination is just a tap away. Book a ride now and travel in comfort."
                                    }
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link 
                                        to={isDriver ? '/driver-dashboard' : '/rider-dashboard'} 
                                        className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors text-center"
                                    >
                                        {isDriver ? 'Go to Driver Dashboard' : 'Book a Ride'}
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to get started?</h2>
                                <p className="text-gray-400 text-lg mb-8">Join millions of riders and drivers who trust RideDeck for their daily commute.</p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link to="/signup" className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors text-center">
                                        Create Account
                                    </Link>
                                    <Link to="/login" className="px-8 py-4 bg-transparent border border-gray-600 text-white font-bold rounded-xl hover:bg-gray-900 transition-colors text-center">
                                        Log In
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="relative">
                        <img 
                            src="/account.png" 
                            alt="Community" 
                            className="w-full h-auto rounded-2xl shadow-lg border-4 border-gray-800"
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
