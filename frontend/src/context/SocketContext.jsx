import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (user) {
      setIsOnline(!!user.isOnline);
    }
  }, [user?.isOnline]);

  useEffect(() => {
    if (user && user.token) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
        auth: {
          token: user.token,
        },
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });

      setSocket(newSocket);

      newSocket.emit('join', user._id);

      return () => newSocket.close();
    }
  }, [user?.token]);

  const value = React.useMemo(() => ({
    socket,
    isOnline,
    setIsOnline
  }), [socket, isOnline]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
