import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Car, Star, Edit2, Save, X } from 'lucide-react';

const Profile = () => {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [message, setMessage] = useState('');

  if (!user) return <div className="pt-24 text-center">Please log in.</div>;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/update/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (response.ok) {
        const updatedUser = { ...user, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.location.reload();
        setIsEditing(false);
        setMessage('Profile updated successfully!');
      } else {
        setMessage('Error: ' + data.message);
      }
    } catch (error) {
      setMessage('Error updating profile');
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-gray-50 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-black mb-8">Account Settings</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Profile Card */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm p-6 text-center border border-gray-100">
                    <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-gray-400">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <h2 className="text-xl font-bold text-black">{user?.name}</h2>
                    <p className="text-gray-500 text-sm mb-6">{user?.role === 'driver' ? 'Driver Account' : 'Rider Account'}</p>
                    
                    <button className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-3">
                        Change Profile Photo
                    </button>
                    <div className="text-xs text-gray-400">
                        Member since {new Date().getFullYear()}
                    </div>
                </div>
            </div>

            {/* Right Column: Details & Settings */}
            <div className="lg:col-span-2 space-y-8">
                {/* Personal Info */}
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-black">Personal Information</h2>
                        <button 
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isEditing 
                                ? 'bg-black text-white hover:bg-gray-800' 
                                : 'bg-gray-100 text-black hover:bg-gray-200'
                            }`}
                        >
                            {isEditing ? 'Save Changes' : 'Edit Details'}
                        </button>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg mb-6 ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                            <input
                                type="text"
                                disabled={!isEditing}
                                className={`w-full p-3 rounded-lg border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                disabled={!isEditing}
                                className={`w-full p-3 rounded-lg border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                            <input
                                type="email"
                                disabled={!isEditing}
                                className={`w-full p-3 rounded-lg border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Saved Places (Placeholder) */}
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                    <h2 className="text-xl font-bold text-black mb-6">Saved Places</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mr-4">
                                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                </div>
                                <div>
                                    <p className="font-bold text-black">Home</p>
                                    <p className="text-sm text-gray-500">Add home address</p>
                                </div>
                            </div>
                            <button className="text-sm font-medium text-gray-400 hover:text-black">Edit</button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mr-4">
                                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                </div>
                                <div>
                                    <p className="font-bold text-black">Work</p>
                                    <p className="text-sm text-gray-500">Add work address</p>
                                </div>
                            </div>
                            <button className="text-sm font-medium text-gray-400 hover:text-black">Edit</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
