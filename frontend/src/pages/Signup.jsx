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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-indigo-600 text-white mb-8 shadow-2xl shadow-indigo-200 transform -rotate-12">
            <User className="h-10 w-10" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">Create account</h2>
          <p className="text-slate-500 font-bold">Join the RideDeck community today</p>
        </div>

        <div className="glass p-10 rounded-[3rem] shadow-2xl border-white/40">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-rose-50 text-rose-500 p-4 rounded-2xl text-center text-sm font-bold border border-rose-100"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="tel"
                  required
                  className="block w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'rider' })}
                  className={`py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border-2 ${formData.role === 'rider' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                >
                  Ride
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'driver' })}
                  className={`py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border-2 ${formData.role === 'driver' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                >
                  Drive
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
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.vehicleType === v.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        <v.icon className={`h-6 w-6 ${formData.vehicleType === v.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${formData.vehicleType === v.id ? 'text-indigo-600' : 'text-slate-400'}`}>{v.id}</span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold"
                    placeholder="Vehicle Number"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  />
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 accent-gradient text-white text-lg font-black rounded-[1.5rem] shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all uppercase tracking-widest flex items-center justify-center gap-3"
            >
              {loading ? 'Creating...' : 'Sign Up'}
              {!loading && <ArrowRight className="h-6 w-6" />}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
            Already have an account? <span className="text-indigo-600">Sign in</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
