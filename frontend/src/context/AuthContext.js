import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Mock user data for demonstration
  const mockUsers = {
    'lecturer@luct.ac.ls': {
      id: 1,
      email: 'lecturer@luct.ac.ls',
      name: 'Dr. John Smith',
      role: 'lecturer',
      faculty: 'FICT',
      program: 'Information Technology'
    },
    'student@luct.ac.ls': {
      id: 2,
      email: 'student@luct.ac.ls',
      name: 'Jane Doe',
      role: 'student',
      faculty: 'FICT',
      program: 'Information Technology',
      class_id: 1
    },
    'prl@luct.ac.ls': {
      id: 3,
      email: 'prl@luct.ac.ls',
      name: 'Prof. David Wilson',
      role: 'prl',
      faculty: 'FICT',
      program: 'Information Technology'
    },
    'pl@luct.ac.ls': {
      id: 4,
      email: 'pl@luct.ac.ls',
      name: 'Dr. Sarah Johnson',
      role: 'pl',
      faculty: 'FICT',
      program: 'Information Technology'
    }
  };

  const checkAuthStatus = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Mock authentication - in real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple mock validation
      if (password === 'password' && mockUsers[email]) {
        const user = mockUsers[email];
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return { data: { user, token: 'mock-jwt-token' } };
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      
      // Mock registration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser = {
        id: Date.now(),
        ...userData,
        created_at: new Date().toISOString()
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return { data: { user: newUser, token: 'mock-jwt-token' } };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};