import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navigation from '../components/Navigation';
import DashboardCard from '../components/DashboardCard';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    myReports: 0,
    complaints: 0,
    pendingApprovals: 0,
    monitoringData: 0,
    ratings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockData = {
        totalReports: 12,
        pendingReports: 3,
        myReports: user?.role === 'lecturer' ? 5 : 0,
        complaints: 2,
        pendingApprovals: user?.role === 'student' ? 2 : 0,
        monitoringData: 8,
        ratings: 15
      };
      
      setStats(mockData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const roleTitles = {
      student: 'Student Representative',
      lecturer: 'Lecturer',
      prl: 'Principal Lecturer',
      pl: 'Program Leader',
      fmg: 'Faculty Management'
    };

    return `Welcome, ${user?.name || 'User'}`;
  };

  const getRoleDescription = () => {
    const descriptions = {
      student: 'As a Student Representative, you can approve reports, file complaints, monitor classes, and rate lecturers.',
      lecturer: 'As a Lecturer, you can create reports, view your reporting history, file complaints, and monitor class activities.',
      prl: 'As a Principal Lecturer, you can review reports, provide feedback, monitor faculty activities, and view ratings.',
      pl: 'As a Program Leader, you can manage courses, assign lecturers, oversee program operations, and monitor performance.',
      fmg: 'As Faculty Management, you have system-wide oversight and monitoring capabilities.'
    };
    return descriptions[user?.role] || 'Welcome to the LUCT Reporting System';
  };

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="container">
          <div className="login-container">
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container">
        <div className="welcome-section">
          <h1>{getWelcomeMessage()}</h1>
          <p>LUCT Reporting System Dashboard - {user?.faculty} Faculty</p>
          <p style={{ color: '#64748b', marginTop: '10px', maxWidth: '600px', margin: '10px auto', lineHeight: '1.6' }}>
            {getRoleDescription()}
          </p>
        </div>

        <div className="stats-grid">
          <DashboardCard 
            title="Total Reports" 
            value={stats.totalReports} 
            color="#a78bfa" 
          />
          <DashboardCard 
            title="Pending Reports" 
            value={stats.pendingReports} 
            color="#f59e0b" 
          />
          <DashboardCard 
            title="My Reports" 
            value={stats.myReports} 
            color="#10b981" 
          />
          <DashboardCard 
            title="My Complaints" 
            value={stats.complaints} 
            color="#ef4444" 
          />
          <DashboardCard 
            title="Class Monitoring" 
            value={stats.monitoringData} 
            color="#0ea5e9" 
          />
          <DashboardCard 
            title="Total Ratings" 
            value={stats.ratings} 
            color="#f97316" 
          />
          {user?.role === 'student' && (
            <DashboardCard 
              title="Pending My Approval" 
              value={stats.pendingApprovals} 
              color="#8b5cf6" 
            />
          )}
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <h3>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              {(user?.role === 'lecturer' || user?.role === 'prl' || user?.role === 'pl' || user?.role === 'fmg') && (
                <a href="/reports" className="btn btn-primary" style={{ textAlign: 'center' }}>
                  📊 Create New Report
                </a>
              )}
              {user?.role !== 'fmg' && (
                <a href="/complaints" className="btn btn-secondary" style={{ textAlign: 'center' }}>
                  🗣️ File Complaint
                </a>
              )}
              {user?.role === 'student' && (
                <a href="/reports" className="btn btn-success" style={{ textAlign: 'center' }}>
                  ✅ Review Pending Reports
                </a>
              )}
              <a href="/monitoring" className="btn btn-info" style={{ textAlign: 'center' }}>
                📈 Class Monitoring
              </a>
              <a href="/rating" className="btn btn-warning" style={{ textAlign: 'center' }}>
                ⭐ Rate & Review
              </a>
              <a href="/courses" className="btn btn-secondary" style={{ textAlign: 'center' }}>
                📚 View Courses
              </a>
              <a href="/classes" className="btn btn-primary" style={{ textAlign: 'center' }}>
                🏫 Manage Classes
              </a>
            </div>
          </div>

          <div className="card">
            <h3>System Information</h3>
            <div style={{ lineHeight: '1.8' }}>
              <p><strong>Faculty:</strong> {user?.faculty || 'Not specified'}</p>
              <p><strong>Program:</strong> {user?.program || 'Not specified'}</p>
              <p><strong>Role:</strong> <span className="user-role" style={{ marginLeft: '10px' }}>{user?.role?.toUpperCase()}</span></p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Member Since:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          <div className="card">
            <h3>Recent Activity</h3>
            <p style={{ color: '#64748b', fontStyle: 'italic' }}>
              {user?.role === 'student' 
                ? 'Check the Reports section to approve pending lecture reports. Use Monitoring to track class attendance and Rating to provide feedback.'
                : user?.role === 'lecturer'
                ? 'Keep your reports updated, monitor class activities, and check ratings and feedback from students.'
                : user?.role === 'prl'
                ? 'Review pending reports, monitor faculty performance, and provide constructive feedback to lecturers.'
                : user?.role === 'pl'
                ? 'Manage course assignments, monitor program performance, and track class activities across the faculty.'
                : 'Monitor system-wide activities, reports, and performance metrics across all faculties.'
              }
            </p>
            <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(167, 139, 250, 0.1)', borderRadius: '8px' }}>
              <small style={{ color: '#64748b' }}>
                Last Updated: {new Date().toLocaleString()}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;