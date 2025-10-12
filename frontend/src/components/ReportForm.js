import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navigation from '../components/Navigation';
import { exportReportsToExcel } from '../utils/exportToExcel';

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchCourses();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'lecturer' ? '/reports/my-reports' : '/reports/all';
      const response = await api.get(endpoint);

      // ✅ Always set reports as an array
      const data = Array.isArray(response.data) ? response.data : [];
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const handleExportExcel = () => exportReportsToExcel(reports);

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="container"><div>Loading reports...</div></div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h1>Lecture Reports</h1>
              <p style={{ color: '#94a3b8' }}>{user?.role === 'lecturer' ? 'My Reports' : 'All Reports'} — {reports.length} found</p>
            </div>
            {reports.length > 0 && (
              <button onClick={handleExportExcel} className="btn btn-success">
                📊 Export to Excel
              </button>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Class</th>
                <th>Lecturer</th>
                <th>Date</th>
                <th>Attendance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(reports) && reports.length > 0 ? (
                reports.map((r) => (
                  <tr key={r.id}>
                    <td>{r.course_name || 'N/A'}<br /><small>{r.course_code}</small></td>
                    <td>{r.class_name || 'N/A'}</td>
                    <td>{r.lecturer_name || 'N/A'}</td>
                    <td>{r.date_of_lecture ? new Date(r.date_of_lecture).toLocaleDateString() : 'N/A'}</td>
                    <td>{r.students_present}/{r.total_students}</td>
                    <td>{r.status || 'pending'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No reports available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
