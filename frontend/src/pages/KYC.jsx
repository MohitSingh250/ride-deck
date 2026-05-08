import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Upload, CheckCircle, AlertCircle, ChevronRight, FileText, Camera, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const KYC = () => {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState({
    license: null,
    rc: null,
    insurance: null,
    selfie: null
  });

  const { user, updateUser } = useAuth(); // Assuming useAuth is available here, otherwise import it
  const navigate = useNavigate(); // Import useNavigate

  const handleFileUpload = (type, e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [type]: file });
      toast.success(`${type.toUpperCase()} uploaded!`);
    }
  };

  const handleSubmit = async () => {
    const loadingToast = toast.loading('Uploading documents...');
    try {
      const formData = new FormData();
      formData.append('license', files.license);
      formData.append('rc', files.rc);
      formData.append('insurance', files.insurance);
      formData.append('selfie', files.selfie);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/driver/kyc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('KYC verified instantly!', { id: loadingToast });
        updateUser({ kycStatus: data.kycStatus });
        setStep(3);
      } else {
        toast.error(data.message || 'Upload failed', { id: loadingToast });
      }
    } catch (error) {
      console.error('KYC Upload Error:', error);
      toast.error('Failed to upload documents', { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-6 lg:px-12">
      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-black tracking-tight">Verify your identity</h1>
                <p className="text-zinc-500 font-medium max-w-md mx-auto">
                  To ensure the safety of our community, we need to verify your documents before you can start driving.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <FileText className="h-6 w-6 text-black" />
                  </div>
                  <h3 className="font-bold text-black">Documents needed</h3>
                  <ul className="space-y-2 text-sm text-zinc-500 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Driver's License</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Vehicle Registration (RC)</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Vehicle Insurance</li>
                  </ul>
                </div>
                <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Camera className="h-6 w-6 text-black" />
                  </div>
                  <h3 className="font-bold text-black">Photo requirements</h3>
                  <ul className="space-y-2 text-sm text-zinc-500 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Clear and readable</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> No glare or blur</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> All corners visible</li>
                  </ul>
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="uber-btn-black w-full py-4 text-lg flex items-center justify-center gap-2 group"
              >
                Get Started <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <button onClick={() => setStep(1)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                  <ChevronRight className="h-6 w-6 text-black rotate-180" />
                </button>
                <h2 className="text-3xl font-bold text-black tracking-tight">Upload Documents</h2>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'license', label: "Driver's License" },
                  { id: 'rc', label: 'Vehicle Registration (RC)' },
                  { id: 'insurance', label: 'Vehicle Insurance' },
                  { id: 'selfie', label: 'Profile Photo (Selfie)' }
                ].map((doc) => (
                  <div key={doc.id} className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${files[doc.id] ? 'bg-emerald-500 text-white' : 'bg-white text-zinc-400'}`}>
                        {files[doc.id] ? <CheckCircle className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="font-bold text-black">{doc.label}</p>
                        <p className="text-xs text-zinc-500 font-medium">{files[doc.id] ? files[doc.id].name : 'Not uploaded yet'}</p>
                      </div>
                    </div>
                    <label className="uber-btn-white py-2 px-4 text-sm cursor-pointer">
                      {files[doc.id] ? 'Change' : 'Upload'}
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(doc.id, e)} />
                    </label>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleSubmit}
                disabled={!files.license || !files.rc || !files.insurance || !files.selfie}
                className="uber-btn-black w-full py-4 text-lg disabled:opacity-30"
              >
                Submit for Review
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-12"
            >
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-black tracking-tight">KYC Verified!</h2>
                <p className="text-zinc-500 font-medium max-w-md mx-auto">
                  Your documents have been verified instantly. You can now start accepting rides and earning.
                </p>
              </div>
              <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center gap-4 max-w-md mx-auto">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
                <p className="text-sm text-zinc-600 font-medium text-left">
                  Your account is now fully verified and ready for action.
                </p>
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="uber-btn-black px-12 py-4 text-lg"
              >
                Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KYC;
