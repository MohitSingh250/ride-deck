import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, Globe, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-3' : 'bg-white py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* Left Side: Logo & Main Links */}
        <div className="flex items-center gap-10">
          <Link to="/" className="text-2xl font-bold text-black tracking-tighter">
            RideDeck
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {user?.role === 'driver' ? (
              <Link to="/driver-dashboard" className="text-sm font-medium text-black hover:bg-zinc-100 px-3 py-2 rounded-full transition-all">Dashboard</Link>
            ) : (
              <Link to="/rider-dashboard" className="text-sm font-medium text-black hover:bg-zinc-100 px-3 py-2 rounded-full transition-all">Ride</Link>
            )}
            <Link to="/history" className="text-sm font-medium text-black hover:bg-zinc-100 px-3 py-2 rounded-full transition-all">Activity</Link>
            <Link to="/about" className="text-sm font-medium text-black hover:bg-zinc-100 px-3 py-2 rounded-full transition-all">About</Link>
          </div>
        </div>

        {/* Right Side: User Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 mr-4">
            <button className="flex items-center gap-2 text-sm font-medium text-black hover:bg-zinc-100 px-3 py-2 rounded-full transition-all">
              <Globe className="h-4 w-4" /> EN
            </button>
            <button 
              onClick={() => navigate('/help')}
              className="flex items-center gap-2 text-sm font-medium text-black hover:bg-zinc-100 px-3 py-2 rounded-full transition-all"
            >
              <HelpCircle className="h-4 w-4" /> Help
            </button>
          </div>

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-full transition-all"
              >
                <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium text-black">{user.name.split(' ')[0]}</span>
                <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-zinc-100 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-zinc-50">
                      <p className="text-sm font-bold text-black">{user.name}</p>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-all">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-all">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-black hover:bg-zinc-100 px-4 py-2 rounded-full transition-all">
                Log in
              </Link>
              <Link to="/signup" className="uber-btn-black px-5 py-2 text-sm rounded-full">
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-zinc-100 rounded-full transition-all"
          >
            {isOpen ? <X className="h-6 w-6 text-black" /> : <Menu className="h-6 w-6 text-black" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-zinc-100 overflow-hidden"
          >
            <div className="px-6 py-8 space-y-6">
              <div className="flex flex-col gap-4">
                {user?.role === 'driver' ? (
                  <Link to="/driver-dashboard" onClick={() => setIsOpen(false)} className="text-xl font-bold text-black">Dashboard</Link>
                ) : (
                  <Link to="/rider-dashboard" onClick={() => setIsOpen(false)} className="text-xl font-bold text-black">Ride</Link>
                )}
                <Link to="/history" onClick={() => setIsOpen(false)} className="text-xl font-bold text-black">Activity</Link>
                <Link to="/about" onClick={() => setIsOpen(false)} className="text-xl font-bold text-black">About</Link>
              </div>

              {!user && (
                <div className="flex flex-col gap-3 pt-6 border-t border-zinc-100">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="uber-btn-white w-full py-4">Log in</Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)} className="uber-btn-black w-full py-4">Sign up</Link>
                </div>
              )}

              {user && (
                <div className="pt-6 border-t border-zinc-100">
                  <button onClick={handleLogout} className="text-xl font-bold text-rose-600">Sign Out</button>
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
