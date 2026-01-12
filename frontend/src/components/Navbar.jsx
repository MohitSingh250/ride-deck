import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User as UserIcon, LogOut, ChevronDown, History, HelpCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`fixed w-full z-[80] transition-all duration-500 ${
      scrolled 
        ? 'py-3 bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20' 
        : 'py-5 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mr-3 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-indigo-200">
                <span className="text-white font-black text-xl">R</span>
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900">
                RideDeck<span className="text-indigo-600">.</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link 
                  to={user.role === 'driver' ? '/driver-dashboard' : '/rider-dashboard'}
                  className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  {user.role === 'driver' ? 'Driver Portal' : 'Book a Ride'}
                </Link>
                
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 pl-3 pr-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-all group"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{user.name}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-20"
                        >
                          <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Account</p>
                            <p className="text-base font-black text-slate-900 truncate">{user.email || user.phone}</p>
                          </div>
                          
                          <div className="p-2">
                            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                              <UserIcon className="h-4 w-4" />
                              Profile Settings
                            </Link>
                            <Link to="/history" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                              <History className="h-4 w-4" />
                              Ride History
                            </Link>
                            <Link to="/help" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                              <HelpCircle className="h-4 w-4" />
                              Help & Support
                            </Link>
                          </div>

                          <div className="p-2 border-t border-slate-100">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                            >
                              <LogOut className="h-4 w-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors px-4 py-2">
                  Log in
                </Link>
                <Link to="/signup" className="bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-indigo-200">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {user ? (
                <>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900">{user.name}</p>
                      <p className="text-sm font-bold text-slate-500">{user.email || user.phone}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Link to={user.role === 'driver' ? '/driver-dashboard' : '/rider-dashboard'} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold">
                      <Settings className="h-5 w-5" />
                      Dashboard
                    </Link>
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-4 text-slate-600 rounded-2xl font-bold">
                      <UserIcon className="h-5 w-5" />
                      Profile
                    </Link>
                    <Link to="/history" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-4 text-slate-600 rounded-2xl font-bold">
                      <History className="h-5 w-5" />
                      History
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-4 text-red-500 rounded-2xl font-bold">
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="w-full py-4 text-center font-bold text-slate-600 bg-slate-50 rounded-2xl">
                    Log In
                  </Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)} className="w-full py-4 text-center font-bold text-white bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
