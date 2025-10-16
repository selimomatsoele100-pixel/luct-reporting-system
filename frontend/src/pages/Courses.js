import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navigation from '../components/Navigation';

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [assigningCourse, setAssigningCourse] = useState(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_code: '',
    course_name: '',
    faculty: '',
    program: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
    if (user?.role === 'pl') {
      fetchLecturers();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses');
      // Handle both response formats
      const coursesData = Array.isArray(response.data) ? response.data : (response.data.courses || []);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      alert('Error loading courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchLecturers = async () => {
    try {
      const response = await api.get('/users/role/lecturer');
      // Handle both response formats
      const lecturersData = Array.isArray(response.data) ? response.data : (response.data.lecturers || []);
      setLecturers(lecturersData);
    } catch (error) {
      console.error('Error fetching lecturers:', error);
    }
  };

  const handleAssignCourse = async (courseId, lecturerId) => {
    if (!lecturerId) return;

    try {
      await api.post('/courses/assign-course', { courseId, lecturerId });
      await fetchCourses();
      setAssigningCourse(null);
      alert('Course assigned successfully!');
    } catch (error) {
      console.error('Error assigning course:', error);
      alert('Error assigning course');
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.course_code || !newCourse.course_name || !newCourse.faculty) {
      alert('Course code, name, and faculty are required');
      return;
    }

    try {
      await api.post('/courses', newCourse);
      await fetchCourses();
      setNewCourse({
        course_code: '',
        course_name: '',
        faculty: '',
        program: ''
      });
      setShowAddCourse(false);
      alert('Course added successfully!');
    } catch (error) {
      console.error('Error adding course:', error);
      alert('Error adding course');
    }
  };

  const getLecturerName = (lecturerId) => {
    const lecturer = lecturers.find(l => l.id === lecturerId);
    return lecturer ? lecturer.name : 'Not assigned';
  };

  return (
    <div>
      <Navigation />
      <div className="container">
        <h1>Courses Management</h1>
        
        {/* Add Course Form for PL */}
        {user?.role === 'pl' && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Manage Courses</h3>
              <button 
                className="btn btn-success"
                onClick={() => setShowAddCourse(!showAddCourse)}
              >
                {showAddCourse ? 'Cancel' : 'Add New Course'}
              </button>
            </div>
            
            {showAddCourse && (
              <form onSubmit={handleAddCourse} style={{ marginTop: '15px', padding: '15px', background: '#1a1a1a', borderRadius: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div className="form-group">
                    <label>Course Code *</label>
                    <input
                      type="text"
                      value={newCourse.course_code}
                      onChange={(e) => setNewCourse({...newCourse, course_code: e.target.value})}
                      placeholder="e.g., WD101, DB201"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Course Name *</label>
                    <input
                      type="text"
                      value={newCourse.course_name}
                      onChange={(e) => setNewCourse({...newCourse, course_name: e.target.value})}
                      placeholder="e.g., Web Development, Database Systems"
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  <div className="form-group">
                    <label>Faculty *</label>
                    <select
                      value={newCourse.faculty}
                      onChange={(e) => setNewCourse({...newCourse, faculty: e.target.value})}
                      required
                    >
                      <option value="">Select Faculty</option>
                      <option value="FICT">FICT</option>
                      <option value="FBMG">FBMG</option>
                      <option value="FABE">FABE</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Program</label>
                    <input
                      type="text"
                      value={newCourse.program}
                      onChange={(e) => setNewCourse({...newCourse, program: e.target.value})}
                      placeholder="e.g., BIT, DIT, BBA"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Add Course
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
        
        <div className="card">
          <h3>All Courses - {user?.faculty} Faculty</h3>
          
          {loading ? (
            <p>Loading courses...</p>
          ) : courses.length === 0 ? (
            <p>No courses found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Faculty</th>
                    <th>Program</th>
                    <th>Assigned Lecturer</th>
                    {user?.role === 'pl' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id}>
                      <td><strong>{course.code || course.course_code}</strong></td>
                      <td>{course.name || course.course_name}</td>
                      <td>{course.faculty}</td>
                      <td>{course.program || 'General'}</td>
                      <td>
                        {course.assigned_lecturer_id ? (
                          <span style={{ color: '#28a745' }}>
                            {getLecturerName(course.assigned_lecturer_id)}
                          </span>
                        ) : (
                          <span style={{ color: '#dc3545', fontStyle: 'italic' }}>
                            Not assigned
                          </span>
                        )}
                      </td>
                      {user?.role === 'pl' && (
                        <td>
                          {assigningCourse === course.id ? (
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                              <select 
                                onChange={(e) => handleAssignCourse(course.id, e.target.value)}
                                style={{ padding: '5px', borderRadius: '4px', border: '1px solid #404040', background: '#1a1a1a', color: 'white' }}
                                autoFocus
                              >
                                <option value="">Select Lecturer</option>
                                {lecturers.map(lecturer => (
                                  <option key={lecturer.id} value={lecturer.id}>
                                    {lecturer.name} - {lecturer.faculty}
                                  </option>
                                ))}
                              </select>
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={() => setAssigningCourse(null)}
                                style={{ padding: '5px 10px' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => setAssigningCourse(course.id)}
                              style={{ padding: '5px 10px' }}
                            >
                              {course.assigned_lecturer_id ? 'Reassign' : 'Assign'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Course management info for PL */}
        {user?.role === 'pl' && (
          <div className="card">
            <h3>Course Assignment Guidelines</h3>
            <div style={{ lineHeight: '1.6' }}>
              <p>As a Program Leader, you can:</p>
              <ul style={{ paddingLeft: '20px', color: '#ccc' }}>
                <li>Add new courses to the system</li>
                <li>Assign lecturers to courses within your program</li>
                <li>Reassign courses when necessary</li>
                <li>Ensure all courses have assigned lecturers</li>
                <li>Monitor course reporting compliance</li>
              </ul>
              <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#888' }}>
                Note: Only lecturers from the same faculty can be assigned to courses.
              </p>
            </div>
          </div>
        )}

        {/* View-only info for other roles */}
        {user?.role !== 'pl' && (
          <div className="card">
            <h3>Course Information</h3>
            <p>
              This page displays all courses available in the {user?.faculty} faculty.
              {user?.role === 'lecturer' && ' Courses assigned to you will appear in your reporting options.'}
              {user?.role === 'prl' && ' You can monitor reports for all courses in your faculty.'}
              {user?.role === 'student' && ' You can view which courses are available in your program.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;