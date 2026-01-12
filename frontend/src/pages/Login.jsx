import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Phone, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(formData.phone, formData.password);
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
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-indigo-600 text-white mb-8 shadow-2xl shadow-indigo-200 transform rotate-12">
            <Lock className="h-10 w-10" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">Welcome back</h2>
          <p className="text-slate-500 font-bold">Enter your details to sign in</p>
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 accent-gradient text-white text-lg font-black rounded-[1.5rem] shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all uppercase tracking-widest flex items-center justify-center gap-3"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight className="h-6 w-6" />}
            </button>
          </form>
        </div>
        
        <div className="text-center">
          <Link to="/signup" className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
            Don't have an account? <span className="text-indigo-600">Sign up</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
