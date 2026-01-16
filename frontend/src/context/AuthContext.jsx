import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Verify token and get fresh data
        try {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${parsedUser.token}` }
          });
          
          if (response.ok) {
            const freshUser = await response.json();
            // Keep the token from localStorage as /me doesn't return it
            const updatedUser = { ...freshUser, token: parsedUser.token };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } else if (response.status === 401) {
            // Only logout if token is actually invalid/expired
            logout();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
        }
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const login = async (phone, password) => {
    try {
      // Sanitize phone: remove all non-numeric characters
      const sanitizedPhone = phone.replace(/\D/g, '');
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sanitizedPhone, password }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
 
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true, user: data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };
 
  const signup = async (userData) => {
    try {
      // Sanitize phone: remove all non-numeric characters
      const sanitizedUserData = { 
        ...userData, 
        phone: userData.phone.replace(/\D/g, '') 
      };

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedUserData),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.errors ? data.errors.map(e => e.msg).join(', ') : data.message;
        throw new Error(errorMsg || 'Signup failed');
      }

      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = (updatedData) => {
    setUser(prev => {
      const newUser = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(newUser));
      console.log('AuthContext: User updated', newUser);
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
