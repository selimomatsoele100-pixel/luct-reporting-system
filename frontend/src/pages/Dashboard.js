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
    pendingApprovals: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [reportsResponse, myReportsResponse, complaintsResponse] = await Promise.all([
        api.get('/reports/all'),
        api.get('/reports/my-reports'),
        api.get('/complaints/my-complaints')
      ]);

      const allReports = reportsResponse.data;
      const myReports = myReportsResponse.data;
      const complaints = complaintsResponse.data;

      setStats({
        totalReports: allReports.length,
        pendingReports: allReports.filter(r => r.status === 'pending').length,
        myReports: myReports.length,
        complaints: complaints.length,
        pendingApprovals: allReports.filter(r => r.status === 'pending' && user.role === 'student').length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

    return `Welcome, ${user?.name}`;
  };

  const getRoleDescription = () => {
    const descriptions = {
      student: 'As a Student Representative, you can approve reports and file complaints against lecturers.',
      lecturer: 'As a Lecturer, you can create reports, view your reporting history, and file complaints against PRL.',
      prl: 'As a Principal Lecturer, you can review reports, provide feedback, and monitor faculty activities.',
      pl: 'As a Program Leader, you can manage courses, assign lecturers, and oversee program operations.',
      fmg: 'As Faculty Management, you have system-wide oversight and monitoring capabilities.'
    };
    return descriptions[user?.role] || '';
  };

  return (
    <div>
      <Navigation />
      <div className="container">
        <div className="welcome-section">
          <h1>{getWelcomeMessage()}</h1>
          <p>LUCT Reporting System Dashboard - {user?.faculty} Faculty</p>
          <p style={{ color: '#ccc', marginTop: '10px', maxWidth: '600px', margin: '10px auto' }}>
            {getRoleDescription()}
          </p>
        </div>

        <div className="stats-grid">
          <DashboardCard 
            title="Total Reports" 
            value={stats.totalReports} 
            color="#007bff" 
          />
          <DashboardCard 
            title="Pending Reports" 
            value={stats.pendingReports} 
            color="#ffc107" 
          />
          <DashboardCard 
            title="My Reports" 
            value={stats.myReports} 
            color="#28a745" 
          />
          <DashboardCard 
            title="My Complaints" 
            value={stats.complaints} 
            color="#dc3545" 
          />
          {user?.role === 'student' && (
            <DashboardCard 
              title="Pending My Approval" 
              value={stats.pendingApprovals} 
              color="#17a2b8" 
            />
          )}
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <h3>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              {(user?.role === 'lecturer' || user?.role === 'prl' || user?.role === 'pl' || user?.role === 'fmg') && (
                <a href="/reports" className="btn btn-primary" style={{ textAlign: 'center' }}>
                  Create New Report
                </a>
              )}
              {user?.role !== 'fmg' && (
                <a href="/complaints" className="btn btn-secondary" style={{ textAlign: 'center' }}>
                  File Complaint
                </a>
              )}
              {user?.role === 'student' && (
                <a href="/reports" className="btn btn-success" style={{ textAlign: 'center' }}>
                  Review Pending Reports
                </a>
              )}
              <a href="/profile" className="btn btn-secondary" style={{ textAlign: 'center' }}>
                View Profile
              </a>
            </div>
          </div>

          <div className="card">
            <h3>System Information</h3>
            <div style={{ lineHeight: '1.8' }}>
              <p><strong>Faculty:</strong> {user?.faculty}</p>
              <p><strong>Program:</strong> {user?.program || 'Not specified'}</p>
              <p><strong>Role:</strong> <span className="user-role" style={{ marginLeft: '10px' }}>{user?.role?.toUpperCase()}</span></p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Last Login:</strong> {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="card">
            <h3>Recent Activity</h3>
            <p style={{ color: '#ccc', fontStyle: 'italic' }}>
              {user?.role === 'student' 
                ? 'Check the Reports section to approve pending lecture reports.'
                : user?.role === 'lecturer'
                ? 'Keep your reports updated and check for any complaints filed against you.'
                : user?.role === 'prl'
                ? 'Review pending reports and provide feedback to lecturers.'
                : user?.role === 'pl'
                ? 'Manage course assignments and monitor program performance.'
                : 'Monitor system-wide activities and reports.'
              }
            </p>
            <div style={{ marginTop: '15px', padding: '10px', background: '#1a1a1a', borderRadius: '4px' }}>
              <small style={{ color: '#888' }}>
                System Status: <span style={{ color: '#28a745' }}>Online</span>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;