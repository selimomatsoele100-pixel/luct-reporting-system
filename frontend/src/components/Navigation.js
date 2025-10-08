import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!user) {
    return null; // Don't render navigation if no user is logged in
  }

  return (
    <nav className="navbar">
      <div className="nav-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ color: 'white', margin: 0 }}>LUCT Reporting</h2>
          <div className="nav-links">
            <Link to="/" className={isActive('/') ? 'active' : ''}>Dashboard</Link>
            <Link to="/reports" className={isActive('/reports') ? 'active' : ''}>Reports</Link>
            <Link to="/complaints" className={isActive('/complaints') ? 'active' : ''}>Complaints</Link>
            
            {/* Add Monitoring and Rating for all roles */}
            <Link to="/monitoring" className={isActive('/monitoring') ? 'active' : ''}>Monitoring</Link>
            <Link to="/rating" className={isActive('/rating') ? 'active' : ''}>Rating</Link>
            
            {(user?.role === 'pl' || user?.role === 'prl') && (
              <Link to="/courses" className={isActive('/courses') ? 'active' : ''}>Courses</Link>
            )}
            {user?.role === 'pl' && (
              <Link to="/classes" className={isActive('/classes') ? 'active' : ''}>Classes</Link>
            )}
            <Link to="/profile" className={isActive('/profile') ? 'active' : ''}>Profile</Link>
          </div>
        </div>
        
        <div className="user-info">
          <span>Welcome, {user?.name}</span>
          <span className="user-role">{user?.role?.toUpperCase()}</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;