import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Upload, 
  Camera, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const KYC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState({
    license: null,
    rc: null,
    selfie: null
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const handleFileChange = (type, e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
      toast.success(`${type.toUpperCase()} selected`);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Mocking file upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch(`${API_URL}/api/driver/kyc`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          kycDocuments: {
            license: 'https://placeholder.com/license.jpg',
            rc: 'https://placeholder.com/rc.jpg',
            selfie: 'https://placeholder.com/selfie.jpg'
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('KYC Documents submitted for verification!');
        setStep(4); // Success step
      }
    } catch (error) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="h-10 w-10 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Driver Verification</h2>
              <p className="text-slate-500 font-bold">Complete your KYC to start accepting rides</p>
            </div>

            <div className="space-y-4">
              {[
                { id: 'license', label: 'Driving License', icon: FileText, desc: 'Front & Back clear photos' },
                { id: 'rc', label: 'Vehicle RC', icon: CarIcon, desc: 'Registration Certificate' },
                { id: 'selfie', label: 'Selfie with ID', icon: Camera, desc: 'For identity verification' },
              ].map((item) => (
                <div key={item.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-indigo-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                      <item.icon className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900">{item.label}</h4>
                      <p className="text-xs font-bold text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  {files[item.id] ? (
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <label className="cursor-pointer">
                      <input type="file" className="hidden" onChange={(e) => handleFileChange(item.id, e)} />
                      <div className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                        <Upload className="h-5 w-5" />
                      </div>
                    </label>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!files.license || !files.rc || !files.selfie}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
            >
              Review & Submit
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              Back to Uploads
            </button>
            
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
              <p className="text-sm font-bold text-amber-900">
                Please ensure all documents are original and clearly visible. Blurred or edited photos will lead to rejection.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-xl">Review Submission</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(files).map(([key, file]) => (
                  <div key={key} className="aspect-square bg-slate-100 rounded-2xl flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-slate-200">
                    <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                    <p className="text-[10px] font-black text-slate-400 uppercase">{key}</p>
                    <p className="text-[8px] font-bold text-slate-500 truncate w-full">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Confirm Submission'
              )}
            </button>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 py-10"
          >
            <div className="h-24 w-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Under Review</h2>
              <p className="text-slate-500 font-bold max-w-xs mx-auto">
                Our team is verifying your documents. This usually takes 24-48 hours. We'll notify you once approved!
              </p>
            </div>
            <button
              onClick={() => navigate('/driver-dashboard')}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all"
            >
              Back to Dashboard
            </button>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4">
      <div className="max-w-xl mx-auto">
        <div className="glass p-10 rounded-[3rem] border-white/40 shadow-2xl">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

const CarIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

export default KYC;
