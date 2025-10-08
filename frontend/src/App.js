import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Login from './components/Login';
import Register from './components/Register';

// Pages
import PublicDashboard from './pages/PublicDashboard';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Complaints from './pages/Complaints';
import Courses from './pages/Courses';
import Classes from './pages/Classes';
import Profile from './pages/Profile';
import Monitoring from './pages/Monitoring';
import Rating from './pages/Rating';

import './App.css';

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="login-container">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/public" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes - accessible to all */}
            <Route path="/public" element={<PublicDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/complaints" element={
              <ProtectedRoute>
                <Complaints />
              </ProtectedRoute>
            } />
            <Route path="/courses" element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            } />
            <Route path="/classes" element={
              <ProtectedRoute>
                <Classes />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/monitoring" element={
              <ProtectedRoute>
                <Monitoring />
              </ProtectedRoute>
            } />
            <Route path="/rating" element={
              <ProtectedRoute>
                <Rating />
              </ProtectedRoute>
            } />
            
            {/* Redirect root to public dashboard */}
            <Route path="*" element={<Navigate to="/public" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;