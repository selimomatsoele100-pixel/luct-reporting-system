import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import PublicHeader from './PublicHeader';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo accounts for testing
  const demoAccounts = [
    { email: 'lecturer@luct.ac.ls', password: 'password', role: 'Lecturer' },
    { email: 'student@luct.ac.ls', password: 'password', role: 'Student' },
    { email: 'prl@luct.ac.ls', password: 'password', role: 'Principal Lecturer' },
    { email: 'pl@luct.ac.ls', password: 'password', role: 'Program Leader' }
  ];

  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div>
      <PublicHeader />
      <div className="login-container">
        <div className="card">
          <h2>Login to LUCT Reporting</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '20px' }}>
            Enter your credentials to access the system
          </p>
          
          {error && <div className="alert alert-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          

          <p style={{ marginTop: '20px', textAlign: 'center', color: '#64748b' }}>
            Don't have an account? <Link to="/register" style={{ color: '#cbd5e1', fontWeight: '600' }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;