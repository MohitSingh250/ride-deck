import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

import { AuthProvider } from './context/AuthContext';

import RiderDashboard from './pages/RiderDashboard';
import DriverDashboard from './pages/DriverDashboard';
import RideHistory from './pages/RideHistory';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route 
                path="/rider-dashboard" 
                element={
                  <ProtectedRoute role="rider">
                    <RiderDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/driver-dashboard" 
                element={
                  <ProtectedRoute role="driver">
                    <DriverDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/history" 
                element={
                  <ProtectedRoute>
                    <RideHistory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
