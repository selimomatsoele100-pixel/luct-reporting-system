import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PublicHeader = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ color: '#f8fafc', margin: 0, fontSize: '1.5rem' }}>LUCT Reporting System</h2>
          <div className="nav-links">
            <Link to="/public" className={location.pathname === '/public' ? 'active' : ''}>
              Home
            </Link>         
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/login" className="btn btn-secondary btn-sm">
            Login
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default PublicHeader;