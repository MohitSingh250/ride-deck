import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Lock, Car, Shield, ArrowRight, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'rider',
    vehicleType: 'bike',
    vehicleNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signup(formData);
      if (result.success) {
        toast.success('Account created successfully!');
        navigate('/');
      } else {
        toast.error(result.message || 'Signup failed');
      }
    } catch (error) {
      toast.error('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white pt-16">

      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-700 via-zinc-900 to-black" />
        </div>
        <div className="relative z-10 max-w-md text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-bold text-white mb-6 tracking-tighter"
          >
            Join RideDeck
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-zinc-400 font-medium"
          >
            Start your journey with us today.
          </motion.p>
        </div>
      </div>


      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div>
            <h2 className="text-4xl font-bold text-black tracking-tight mb-2">Create account</h2>
            <p className="text-zinc-500 font-medium">Join thousands of riders and drivers</p>
          </div>


          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFormData({ ...formData, role: 'rider' })}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-2 ${formData.role === 'rider' ? 'border-black bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'}`}
            >
              <User className={`h-6 w-6 ${formData.role === 'rider' ? 'text-black' : 'text-zinc-400'}`} />
              <span className={`font-bold text-sm ${formData.role === 'rider' ? 'text-black' : 'text-zinc-500'}`}>Rider</span>
            </button>
            <button
              onClick={() => setFormData({ ...formData, role: 'driver' })}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-2 ${formData.role === 'driver' ? 'border-black bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'}`}
            >
              <Car className={`h-6 w-6 ${formData.role === 'driver' ? 'text-black' : 'text-zinc-400'}`} />
              <span className={`font-bold text-sm ${formData.role === 'driver' ? 'text-black' : 'text-zinc-500'}`}>Driver</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-black uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="uber-input w-full !pl-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-black uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="uber-input w-full !pl-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-black uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="uber-input w-full !pl-12"
                  required
                />
              </div>
            </div>


            <AnimatePresence>
              {formData.role === 'driver' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-black uppercase tracking-wider">Vehicle Type</label>
                    <div className="relative">
                      <Car className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        className="uber-input w-full !pl-12 appearance-none"
                      >
                        <option value="bike">Bike</option>
                        <option value="auto">Auto</option>
                        <option value="cab">Cab</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-black uppercase tracking-wider">Vehicle Number</label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                      <input
                        type="text"
                        name="vehicleNumber"
                        placeholder="DL 1C AB 1234"
                        value={formData.vehicleNumber}
                        onChange={handleChange}
                        className="uber-input w-full !pl-12"
                        required={formData.role === 'driver'}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="uber-btn-black w-full py-4 text-lg flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create account <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-8 border-t border-zinc-100">
            <p className="text-zinc-500 font-medium">
              Already have an account? {' '}
              <Link to="/login" className="text-black font-bold hover:underline">Log in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
