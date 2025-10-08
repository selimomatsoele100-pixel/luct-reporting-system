import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FACULTIES, ROLES } from '../utils/constants';
import api from '../services/api';
import PublicHeader from './PublicHeader';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    faculty: '',
    class_id: null,
    program: ''
  });
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingClasses, setFetchingClasses] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setFetchingClasses(true);
      const response = await api.get('/courses/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error.message);
    } finally {
      setFetchingClasses(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'class_id') {
      setFormData({
        ...formData,
        [name]: value === '' ? null : parseInt(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Prepare data for submission
    const submitData = {
      ...formData,
      class_id: formData.class_id || null
    };

    try {
      await register(submitData);
      navigate('/');
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only show class selection for students
  const showClassSelection = formData.role === ROLES.STUDENT;

  return (
    <div>
      <PublicHeader />
      <div className="login-container">
        <div className="card">
          <h2>Register for LUCT Reporting</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '20px' }}>
            Create your account to access the reporting system
          </p>
          
          {error && <div className="alert alert-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your email address"
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Create a password"
              />
            </div>
            <div className="form-group">
              <label>Role:</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                required
                disabled={loading}
              >
                <option value="">Select Role</option>
                <option value={ROLES.STUDENT}>Student Representative</option>
                <option value={ROLES.LECTURER}>Lecturer</option>
                <option value={ROLES.PRL}>Principal Lecturer (PRL)</option>
                <option value={ROLES.PL}>Program Leader (PL)</option>
                <option value={ROLES.FMG}>Faculty Management (FMG)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Faculty:</label>
              <select 
                name="faculty" 
                value={formData.faculty} 
                onChange={handleChange} 
                required
                disabled={loading}
              >
                <option value="">Select Faculty</option>
                <option value={FACULTIES.FICT}>FICT</option>
                <option value={FACULTIES.FBMG}>FBMG</option>
                <option value={FACULTIES.FABE}>FABE</option>
              </select>
            </div>
            
            {/* Class selection - only for students */}
            {showClassSelection && (
              <div className="form-group">
                <label>Select Your Class:</label>
                <select 
                  name="class_id" 
                  value={formData.class_id || ''} 
                  onChange={handleChange}
                  disabled={loading || fetchingClasses}
                >
                  <option value="">Select Class</option>
                  {classes
                    .filter(classItem => classItem.faculty === formData.faculty)
                    .map(classItem => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.class_name} - {classItem.program}
                      </option>
                    ))
                  }
                </select>
                {fetchingClasses && <small>Loading classes...</small>}
              </div>
            )}

            <div className="form-group">
              <label>Program:</label>
              <input
                type="text"
                name="program"
                value={formData.program}
                onChange={handleChange}
                placeholder="e.g., Information Technology"
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          <p style={{ marginTop: '20px', textAlign: 'center', color: '#64748b' }}>
            Already have an account? <Link to="/login" style={{ color: '#cbd5e1', fontWeight: '600' }}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;