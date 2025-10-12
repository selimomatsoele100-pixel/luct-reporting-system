import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navigation from '../components/Navigation';
import { exportReportsToExcel } from '../utils/exportToExcel';

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    faculty: '',
    class_name: '',
    week_of_reporting: '',
    date_of_lecture: '',
    course_name: '',
    course_code: '',
    students_present: '',
    total_students: '',
    venue: '',
    scheduled_time: '',
    topic_taught: '',
    learning_outcomes: '',
    recommendations: ''
  });
  const [courses, setCourses] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchCourses();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      if (user?.role === 'lecturer') {
        response = await api.get('/reports/my-reports');
      } else {
        response = await api.get('/reports/all');
      }
      
      setReports(response.data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleExportExcel = () => {
    exportReportsToExcel(reports);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'course_code') {
      const selectedCourse = courses.find(course => course.course_code === value);
      if (selectedCourse) {
        setFormData(prev => ({
          ...prev,
          course_name: selectedCourse.course_name,
          faculty: selectedCourse.faculty
        }));
      }
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const reportData = {
        ...formData,
        lecturer_name: user?.name,
        status: 'pending'
      };

      const response = await api.post('/reports', reportData);
      
      setReports(prev => [response.data.report, ...prev]);
      
      setFormData({
        faculty: '',
        class_name: '',
        week_of_reporting: '',
        date_of_lecture: '',
        course_name: '',
        course_code: '',
        students_present: '',
        total_students: '',
        venue: '',
        scheduled_time: '',
        topic_taught: '',
        learning_outcomes: '',
        recommendations: ''
      });
      
      setShowReportForm(false);
    } catch (error) {
      console.error('Error submitting report:', error);
      setError('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const getAttendanceRate = (report) => {
    if (!report.students_present || !report.total_students) return '0%';
    return `${Math.round((report.students_present / report.total_students) * 100)}%`;
  };

  const canCreateReports = user?.role === 'lecturer' || user?.role === 'prl' || user?.role === 'pl' || user?.role === 'fmg';

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="container">
          <div className="login-container">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container">
        {canCreateReports && showReportForm && (
          <div className="card" style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Create New Report</h2>
              <button 
                onClick={() => setShowReportForm(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitReport}>
              <div className="form-row">
                <div className="form-group">
                  <label>Course Code</label>
                  <select
                    name="course_code"
                    value={formData.course_code}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.course_code}>
                        {course.course_code} - {course.course_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Faculty</label>
                  <input
                    type="text"
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Class Name</label>
                  <input
                    type="text"
                    name="class_name"
                    value={formData.class_name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Week of Reporting</label>
                  <input
                    type="text"
                    name="week_of_reporting"
                    value={formData.week_of_reporting}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Lecture</label>
                  <input
                    type="date"
                    name="date_of_lecture"
                    value={formData.date_of_lecture}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Course Name</label>
                  <input
                    type="text"
                    name="course_name"
                    value={formData.course_name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Students Present</label>
                  <input
                    type="number"
                    name="students_present"
                    value={formData.students_present}
                    onChange={handleFormChange}
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Total Students</label>
                  <input
                    type="number"
                    name="total_students"
                    value={formData.total_students}
                    onChange={handleFormChange}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Venue</label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Scheduled Time</label>
                  <input
                    type="time"
                    name="scheduled_time"
                    value={formData.scheduled_time}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Topic Taught</label>
                <textarea
                  name="topic_taught"
                  value={formData.topic_taught}
                  onChange={handleFormChange}
                  required
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Learning Outcomes</label>
                <textarea
                  name="learning_outcomes"
                  value={formData.learning_outcomes}
                  onChange={handleFormChange}
                  required
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Recommendations</label>
                <textarea
                  name="recommendations"
                  value={formData.recommendations}
                  onChange={handleFormChange}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Create Report'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1>Lecture Reports</h1>
              <p style={{ color: '#cbd5e1', margin: 0 }}>
                {user?.role === 'lecturer' ? 'My Reports' : 'All Reports'} - {reports.length} found
              </p>
            </div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              {canCreateReports && !showReportForm && (
                <button 
                  onClick={() => setShowReportForm(true)} 
                  className="btn btn-primary"
                >
                  Create Report
                </button>
              )}
              {reports.length > 0 && (
                <button onClick={handleExportExcel} className="btn btn-success">
                  Export to Excel
                </button>
              )}
            </div>
          </div>

          {error && !showReportForm && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="table">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Class</th>
                  <th>Lecturer</th>
                  <th>Date</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div>{report.course_name}</div>
                      <small style={{ color: '#94a3b8' }}>{report.course_code}</small>
                    </td>
                    <td>{report.class_name}</td>
                    <td>{report.lecturer_name}</td>
                    <td>{report.date_of_lecture ? new Date(report.date_of_lecture).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="attendance-rate">
                        <span className="rate">
                          {getAttendanceRate(report)}
                        </span>
                        <small>
                          ({report.students_present}/{report.total_students})
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${report.status}`}>
                        {report.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          const details = `
                            Course: ${report.course_name}
                            Class: ${report.class_name}
                            Lecturer: ${report.lecturer_name}
                            Date: ${report.date_of_lecture ? new Date(report.date_of_lecture).toLocaleDateString() : 'N/A'}
                            Topic: ${report.topic_taught}
                            Attendance: ${getAttendanceRate(report)}
                            Learning Outcomes: ${report.learning_outcomes}
                            ${report.recommendations ? `Recommendations: ${report.recommendations}` : ''}
                          `;
                          alert(`Report Details:\n\n${details}`);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.length === 0 && !error && (
              <div className="no-data">
                {canCreateReports ? (
                  <div style={{ textAlign: 'center' }}>
                    <p>No reports found.</p>
                    <button 
                      onClick={() => setShowReportForm(true)} 
                      className="btn btn-primary"
                      style={{ marginTop: '10px' }}
                    >
                      Create Your First Report
                    </button>
                  </div>
                ) : (
                  <p>No reports available.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;