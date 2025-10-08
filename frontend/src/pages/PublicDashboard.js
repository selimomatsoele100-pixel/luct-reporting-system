import React from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';

const PublicDashboard = () => {
  return (
    <div className="public-dashboard">
      <PublicHeader />
      <div className="container">
        {/* Hero Section */}
        <div className="public-hero">
          <h1>LUCT Reporting System</h1>
          <p>
            Streamline academic reporting, monitoring, and feedback across all faculties. 
            A comprehensive platform for lecturers, students, and faculty management.
          </p>
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Academic Reporting</h3>
            <p>
              Lecturers can easily create and submit detailed class reports including 
              attendance, topics covered, and learning outcomes with automated tracking.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👨‍🏫</div>
            <h3>Faculty Monitoring</h3>
            <p>
              Principal Lecturers and Program Leaders can monitor class activities, 
              attendance rates, and academic performance across all courses.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3>Rating & Feedback</h3>
            <p>
              Students can provide valuable feedback and ratings for courses and lecturers, 
              helping improve teaching quality and learning experience.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Real-time Tracking</h3>
            <p>
              Monitor class attendance, report submissions, and approval workflows in 
              real-time with comprehensive analytics and reporting tools.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Complaint Management</h3>
            <p>
              Structured system for submitting and resolving academic complaints with 
              proper escalation paths and transparent tracking.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏫</div>
            <h3>Multi-Faculty Support</h3>
            <p>
              Supports FICT, FBMG, FABE faculties with role-based access control for 
              students, lecturers, PRLs, PLs, and faculty management.
            </p>
          </div>
        </div>

        {/* Statistics Section */}
        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">500+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">1.2K+</div>
              <div className="stat-label">Reports Monthly</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">95%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">4.8/5</div>
              <div className="stat-label">System Rating</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div style={{ textAlign: 'center', marginTop: '60px', padding: '40px' }}>
          <h2 style={{ color: '#f8fafc', marginBottom: '20px' }}>Ready to Get Started?</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '30px', maxWidth: '600px', margin: '0 auto' }}>
            Join hundreds of faculty members and students already using the LUCT Reporting System 
            to enhance academic transparency and efficiency.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicDashboard;