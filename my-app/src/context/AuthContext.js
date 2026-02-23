import React, { createContext, useState, useEffect, useContext } from 'react';
import { getMe } from '../services/api';

export const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await getMe();
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (err) {
        // Token geçersiz veya süresi dolmuş
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    try {
      const response = await getMe();
      setUser(response.data);
      return response.data;
    } catch (err) {
      // Hata durumunda
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}