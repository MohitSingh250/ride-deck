import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Phone, Lock, Bike, Car, Truck, ArrowRight } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'rider',
    vehicleType: 'bike',
    vehicleNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signup(formData);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <h2 className="text-center text-4xl font-black text-black tracking-tight">Create account</h2>
          <p className="mt-2 text-center text-gray-500 font-medium">Join the Ride-Deck community today</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 text-red-500 p-4 rounded-2xl text-center text-sm font-bold border border-red-100"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
              </div>
              <input
                type="text"
                required
                className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black transition-all font-medium"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
              </div>
              <input
                type="tel"
                required
                className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black transition-all font-medium"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
              </div>
              <input
                type="password"
                required
                className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black transition-all font-medium"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'rider' })}
                className={`py-4 rounded-2xl font-bold transition-all border-2 ${formData.role === 'rider' ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
              >
                I want to Ride
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'driver' })}
                className={`py-4 rounded-2xl font-bold transition-all border-2 ${formData.role === 'driver' ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
              >
                I want to Drive
              </button>
            </div>

            {formData.role === 'driver' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-4"
              >
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'bike', icon: Bike },
                    { id: 'auto', icon: Truck },
                    { id: 'cab', icon: Car },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, vehicleType: v.id })}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.vehicleType === v.id ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <v.icon className={`h-6 w-6 ${formData.vehicleType === v.id ? 'text-black' : 'text-gray-400'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${formData.vehicleType === v.id ? 'text-black' : 'text-gray-400'}`}>{v.id}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  className="block w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-black transition-all font-medium"
                  placeholder="Vehicle Number (e.g. DL 12 AB 1234)"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                />
              </motion.div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-lg font-black rounded-2xl text-white bg-black hover:bg-gray-800 focus:outline-none transition-all transform active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-black transition-colors">
            Already have an account? <span className="text-black">Sign in</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
