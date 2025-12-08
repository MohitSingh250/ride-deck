import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div>
            <Link to="/" className="text-2xl font-bold tracking-tight mb-6 block">RideDeck</Link>
            <p className="text-gray-400 text-sm mb-6">
              Moving people and packages, safely and sustainably.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Company</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-white transition-colors">About us</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/press" className="hover:text-white transition-colors">Press</Link></li>
            </ul>
          </div>

          {/* Products Column */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Products</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/ride" className="hover:text-white transition-colors">Ride</Link></li>
              <li><Link to="/drive" className="hover:text-white transition-colors">Drive</Link></li>
              <li><Link to="/business" className="hover:text-white transition-colors">Business</Link></li>
              <li><Link to="/freight" className="hover:text-white transition-colors">Freight</Link></li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Support</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/safety" className="hover:text-white transition-colors">Safety</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} RideDeck Technologies Inc.
          </p>
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center hover:text-white cursor-pointer transition-colors">
                <Globe className="h-4 w-4 mr-2" />
                <span>English</span>
            </div>
            <span className="hidden md:inline">|</span>
            <div className="flex items-center hover:text-white cursor-pointer transition-colors">
                <span>Delhi, India</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
