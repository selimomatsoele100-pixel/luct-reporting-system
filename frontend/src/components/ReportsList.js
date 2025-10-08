import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../api';

const ReportsList = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchReports();
  }, [user]);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, activeTab]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let response;
      
      if (user.role === 'student') {
        response = await reportsAPI.getUnsignedReports();
      } else {
        response = await reportsAPI.getAll();
      }
      
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.lecturer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tab
    if (activeTab === 'unsigned') {
      filtered = filtered.filter(report => !report.student_signed);
    } else if (activeTab === 'signed') {
      filtered = filtered.filter(report => report.student_signed);
    } else if (activeTab === 'my-reports' && user.role !== 'student') {
      filtered = filtered.filter(report => report.lecturer_id === user.id);
    }

    setFilteredReports(filtered);
  };

  const signReport = async (reportId) => {
    try {
      await reportsAPI.signReport(reportId);
      fetchReports(); // Refresh the list
      alert('Report signed successfully!');
    } catch (error) {
      alert('Failed to sign report: ' + (error.response?.data?.error || 'Please try again.'));
    }
  };

  const downloadReport = (report) => {
    const reportData = `
LUCT REPORTING SYSTEM
=====================

Faculty: ${report.faculty_name}
Class: ${report.class_name}
Week: ${report.week_of_reporting}
Date: ${new Date(report.date_of_lecture).toLocaleDateString()}

COURSE INFORMATION
------------------
Course: ${report.course_name} (${report.course_code})
Lecturer: ${report.lecturer_name}
Venue: ${report.venue}
Time: ${report.scheduled_time}

ATTENDANCE
----------
Present: ${report.actual_students_present}
Registered: ${report.total_registered_students}

TOPIC COVERED
-------------
${report.topic_taught}

LEARNING OUTCOMES
-----------------
${report.learning_outcomes}

RECOMMENDATIONS
---------------
${report.recommendations}

STATUS
------
Student Signed: ${report.student_signed ? 'YES' : 'NO'}
PRL Reviewed: ${report.prl_reviewed ? 'YES' : 'NO'}
Created: ${new Date(report.created_at).toLocaleString()}
    `;

    const blob = new Blob([reportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report.course_code}-${report.date_of_lecture}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <div className="card">
      <h2>Reports Management</h2>

      {/* Search Box */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search by course, class, or lecturer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Reports
        </button>
        
        {user.role === 'student' ? (
          <button 
            className={`nav-tab ${activeTab === 'unsigned' ? 'active' : ''}`}
            onClick={() => setActiveTab('unsigned')}
          >
            To Sign ({reports.filter(r => !r.student_signed).length})
          </button>
        ) : (
          <>
            <button 
              className={`nav-tab ${activeTab === 'my-reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-reports')}
            >
              My Reports
            </button>
            <button 
              className={`nav-tab ${activeTab === 'unsigned' ? 'active' : ''}`}
              onClick={() => setActiveTab('unsigned')}
            >
              Unsigned ({reports.filter(r => !r.student_signed).length})
            </button>
          </>
        )}
      </div>

      {/* Reports Table */}
      <div className="tab-content">
        {filteredReports.length === 0 ? (
          <p>No reports found.</p>
        ) : (
          <table className="table">
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
              {filteredReports.map(report => (
                <tr key={report.id}>
                  <td>{report.course_name} ({report.course_code})</td>
                  <td>{report.class_name}</td>
                  <td>{report.lecturer_name}</td>
                  <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                  <td>{report.actual_students_present}/{report.total_registered_students}</td>
                  <td>
                    {report.student_signed ? (
                      <span className="report-signed">Signed</span>
                    ) : (
                      <span className="report-unsigned">Pending Signature</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => downloadReport(report)}
                      >
                        Download
                      </button>
                      
                      {user.role === 'student' && !report.student_signed && (
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => signReport(report.id)}
                        >
                          Sign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Action Buttons */}
      {user.role !== 'student' && (
        <div className="action-buttons" style={{ marginTop: '2rem' }}>
          <a href="/reports/new" className="btn btn-primary">Create New Report</a>
          <a href="/dashboard" className="btn btn-danger">Back to Dashboard</a>
        </div>
      )}
    </div>
  );
};

export default ReportsList;