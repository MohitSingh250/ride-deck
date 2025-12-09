import React, { useState } from 'react';
import { ArrowRight, Clock, MapPin, Shield, Star, Smartphone, Globe, Navigation, Banknote, Calendar, ShieldCheck, User, Car } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        <div className="pt-16 min-h-screen bg-white font-sans">
            {/* Split Hero Section */}
            <div className="relative bg-black text-white overflow-hidden min-h-[90vh] flex flex-col lg:flex-row">
                {/* Background Image */}
                <div className="absolute inset-0 z-0 opacity-30">
                    <img 
                        src="https://images.unsplash.com/photo-1758708312845-91ebc394cf27?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDZ8fGlsbHVzdHJhdGlvbiUyMG1pbmltYWxpc3R8ZW58MHx8MHx8fDA%3D" 
                        alt="Background" 
                        className="w-full h-full object-cover" 
                    />
                </div>

                {/* Left Side: Rider */}
                <div className="flex-1 relative z-10 flex items-center justify-center p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-gray-800 bg-black/40 backdrop-blur-sm hover:bg-black/30 transition-colors group">
                    <div className="max-w-md text-center lg:text-left">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-black mb-6 group-hover:scale-110 transition-transform">
                            <User className="h-8 w-8" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                            Get a ride<br/>in minutes.
                        </h2>
                        <p className="text-xl text-gray-300 mb-8">
                            Go anywhere, get anything. Reliable rides at the tap of a button.
                        </p>
                        <Link 
                            to="/login" 
                            className="inline-flex items-center px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all transform hover:-translate-y-1"
                        >
                            Ride with us <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                </div>

                {/* Right Side: Driver */}
                <div className="flex-1 relative z-10 flex items-center justify-center p-8 lg:p-16 bg-black/40 backdrop-blur-sm hover:bg-black/30 transition-colors group">
                    <div className="max-w-md text-center lg:text-left">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-black mb-6 group-hover:scale-110 transition-transform">
                            <Car className="h-8 w-8" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
                            Earn on<br/>your terms.
                        </h2>
                        <p className="text-xl text-gray-300 mb-8">
                            Drive when you want, make what you need. No boss, no limits.
                        </p>
                        <Link 
                            to="/signup" 
                            state={{ role: 'driver' }}
                            className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-black transition-all transform hover:-translate-y-1"
                        >
                            Sign up to drive <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Value Props */}
            <div className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-black mb-4">Why choose RideDeck?</h2>
                        <p className="text-xl text-gray-500">The smartest way to move and earn.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="h-8 w-8 text-black" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Safety First</h3>
                            <p className="text-gray-500">Verified drivers, real-time tracking, and 24/7 support for your peace of mind.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Banknote className="h-8 w-8 text-black" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Best Prices</h3>
                            <p className="text-gray-500">Transparent pricing with no hidden fees. Know exactly what you pay or earn.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Globe className="h-8 w-8 text-black" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Available Everywhere</h3>
                            <p className="text-gray-500">From city centers to suburbs, we've got you covered wherever you go.</p>
                        </div>
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
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-black mb-6 leading-tight">
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
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-gray-500 mb-8 px-4">
                        {isDriver 
                            ? "Earn on your own schedule. No boss, no limits. Just you and the open road."
                            : "Request a ride, hop in, and go. Reliable, safe, and always ready when you are."
                        }
                    </p>
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
