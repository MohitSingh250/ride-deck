import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User as UserIcon, LogOut } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm fixed w-full z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <span className="text-2xl font-black tracking-tighter text-black">
                RideDeck<span className="text-gray-400">.</span>
              </span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {/* Links removed as requested */}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 gap-4">
              {user ? (
                <>
                    {/* Primary Action Button */}
                    <Link 
                        to={user.role === 'driver' ? '/driver-dashboard' : '/rider-dashboard'}
                        className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg flex items-center"
                    >
                        {user.role === 'driver' ? (
                            <>
                                <span className="mr-2">Driver Dashboard</span>
                            </>
                        ) : (
                            <>
                                <span className="mr-2">Book a Ride</span>
                            </>
                        )}
                    </Link>

                    <div className="relative ml-3">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center max-w-xs text-sm font-medium text-black rounded-full focus:outline-none hover:bg-gray-50 px-3 py-2 transition-colors"
                        >
                            <span className="mr-2 text-base font-bold">{user.name}</span>
                            <UserIcon className="h-6 w-6 p-1 bg-gray-100 rounded-full" />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden animate-fade-in-down">
                                <div className="px-6 py-6 border-b border-gray-100 bg-gray-50">
                                    <p className="text-sm text-gray-500">Signed in as</p>
                                    <p className="text-lg font-bold text-black truncate">{user.email || user.phone}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50">
                                    <Link to="/profile" className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <UserIcon className="h-6 w-6 text-black mb-2" />
                                        <span className="text-sm font-medium text-gray-900">Profile</span>
                                    </Link>
                                    <Link to="/history" className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="h-6 w-6 text-black mb-2 flex items-center justify-center font-bold border-2 border-black rounded-full text-xs">H</div>
                                        <span className="text-sm font-medium text-gray-900">History</span>
                                    </Link>
                                </div>

                                <div className="py-2">
                                    <Link to="/help" className="block px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-black font-medium">
                                        Help & Support
                                    </Link>
                                </div>

                                <div className="border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-6 py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-gray-900 hover:text-black px-3 py-2 text-sm font-medium transition-colors">Log in</Link>
                  <Link to="/signup" className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg">Sign up</Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-black focus:outline-none"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
              <>
                <div className="px-3 py-2 text-gray-900 font-medium">{user.name}</div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-gray-600 hover:text-black block px-3 py-2 rounded-md text-base font-medium"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-900 block px-3 py-2 rounded-md text-base font-medium">Log in</Link>
                <Link to="/signup" className="text-black font-bold block px-3 py-2 rounded-md text-base font-medium">Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
