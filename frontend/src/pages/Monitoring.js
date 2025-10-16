import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navigation from '../components/Navigation';
import { exportMonitoringToExcel } from '../utils/exportToExcel';

const Monitoring = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    faculty: '',
    course: '',
    lecturer: '',
    week: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/monitoring/data');
      // FIX: Use recentActivity array instead of the whole object
      const data = response.data.recentActivity || [];
      
      setAttendanceData(data);
      setFilteredData(data);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setError('Failed to load monitoring data');
      setAttendanceData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    let filtered = attendanceData;

    if (filters.faculty) {
      filtered = filtered.filter(item => 
        item.faculty?.toLowerCase().includes(filters.faculty.toLowerCase())
      );
    }

    if (filters.course) {
      filtered = filtered.filter(item => 
        item.courseName?.toLowerCase().includes(filters.course.toLowerCase()) ||
        item.course_code?.toLowerCase().includes(filters.course.toLowerCase()) ||
        item.course_name?.toLowerCase().includes(filters.course.toLowerCase())
      );
    }

    if (filters.lecturer) {
      filtered = filtered.filter(item => 
        item.lecturer?.toLowerCase().includes(filters.lecturer.toLowerCase()) ||
        item.lecturer_name?.toLowerCase().includes(filters.lecturer.toLowerCase())
      );
    }

    if (filters.week) {
      filtered = filtered.filter(item => 
        item.week?.toLowerCase().includes(filters.week.toLowerCase()) ||
        item.week_of_reporting?.toLowerCase().includes(filters.week.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const resetFilters = () => {
    setFilters({
      faculty: '',
      course: '',
      lecturer: '',
      week: ''
    });
    setFilteredData(attendanceData);
  };

  const handleExportExcel = () => {
    exportMonitoringToExcel(filteredData);
  };

  const getAttendanceRate = (record) => {
    const present = record.present || record.students_present || 0;
    const registered = record.registered || record.total_students || 0;
    
    if (registered === 0) return '0%';
    return `${Math.round((present / registered) * 100)}%`;
  };

  const getAttendanceClass = (record) => {
    const present = record.present || record.students_present || 0;
    const registered = record.registered || record.total_students || 0;
    
    if (registered === 0) return 'low';
    const rate = (present / registered) * 100;
    return rate < 70 ? 'low' : '';
  };

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="container">
          <div className="login-container">Loading monitoring data...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div className="monitoring-header">
              <h1>Class Monitoring</h1>
              <p>Monitor attendance and class activities across all faculties</p>
            </div>
            {filteredData.length > 0 && (
              <div className="export-buttons">
                <button onClick={handleExportExcel} className="btn btn-success">
                  Export to Excel
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="monitoring-filters">
            <div className="filter-row">
              <div className="form-group">
                <label>Faculty</label>
                <input
                  type="text"
                  name="faculty"
                  value={filters.faculty}
                  onChange={handleFilterChange}
                  placeholder="Filter by faculty"
                />
              </div>
              <div className="form-group">
                <label>Course</label>
                <input
                  type="text"
                  name="course"
                  value={filters.course}
                  onChange={handleFilterChange}
                  placeholder="Filter by course name/code"
                />
              </div>
              <div className="form-group">
                <label>Lecturer</label>
                <input
                  type="text"
                  name="lecturer"
                  value={filters.lecturer}
                  onChange={handleFilterChange}
                  placeholder="Filter by lecturer"
                />
              </div>
              <div className="form-group">
                <label>Week</label>
                <input
                  type="text"
                  name="week"
                  value={filters.week}
                  onChange={handleFilterChange}
                  placeholder="Filter by week"
                />
              </div>
            </div>
            <div className="form-actions">
              <button onClick={applyFilters} className="btn btn-primary">
                Apply Filters
              </button>
              <button onClick={resetFilters} className="btn btn-secondary">
                Reset
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Classes</h3>
              <div className="stat-number">{filteredData.length}</div>
            </div>
            <div className="stat-card">
              <h3>Average Attendance</h3>
              <div className="stat-number">
                {filteredData.length > 0 
                  ? `${Math.round(
                      filteredData.reduce((acc, curr) => {
                        const present = curr.present || curr.students_present || 0;
                        const registered = curr.registered || curr.total_students || 1;
                        return acc + (present / registered) * 100;
                      }, 0) / filteredData.length
                    )}%`
                  : '0%'
                }
              </div>
            </div>
            <div className="stat-card">
              <h3>Total Students</h3>
              <div className="stat-number">
                {filteredData.reduce((acc, curr) => acc + (curr.registered || curr.total_students || 0), 0)}
              </div>
            </div>
          </div>

          <div className="attendance-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Class</th>
                  <th>Course</th>
                  <th>Lecturer</th>
                  <th>Week</th>
                  <th>Date</th>
                  <th>Attendance</th>
                  <th>Venue</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((record) => (
                  <tr key={record.id}>
                    <td>{record.faculty || 'N/A'}</td>
                    <td>{record.className || record.class_name || 'N/A'}</td>
                    <td>
                      <div>{record.courseName || record.course_name || 'N/A'}</div>
                      <small>{record.courseCode || record.course_code || 'No code'}</small>
                    </td>
                    <td>{record.lecturer || record.lecturer_name || 'N/A'}</td>
                    <td>{record.week || record.week_of_reporting || 'N/A'}</td>
                    <td>{record.date || record.date_of_lecture || 'N/A'}</td>
                    <td>
                      <div className="attendance-rate">
                        <span className={`rate ${getAttendanceClass(record)}`}>
                          {getAttendanceRate(record)}
                        </span>
                        <small>
                          ({record.present || record.students_present || 0}/{record.registered || record.total_students || 0})
                        </small>
                      </div>
                    </td>
                    <td>{record.venue || 'N/A'}</td>
                    <td>{record.scheduledTime || record.scheduled_time || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && !error && (
              <div className="no-data">
                No monitoring data found matching your filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;