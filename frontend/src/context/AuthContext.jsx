import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('movies_mania_token'));
  const [loading, setLoading] = useState(true);

  // Setup custom Axios instance with base URL and interceptors
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000'),
  });

  // Attach token automatically to all requests if present
  api.interceptors.request.use(
    (config) => {
      const currentToken = localStorage.getItem('movies_mania_token');
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Load user details if token is already stored
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/api/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // If token is invalid or expired, clear it
        localStorage.removeItem('movies_mania_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token: receivedToken, ...userData } = response.data;
      localStorage.setItem('movies_mania_token', receivedToken);
      setToken(receivedToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid email or password'
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/api/auth/register', { name, email, password });
      const { token: receivedToken, ...userData } = response.data;
      localStorage.setItem('movies_mania_token', receivedToken);
      setToken(receivedToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('movies_mania_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
