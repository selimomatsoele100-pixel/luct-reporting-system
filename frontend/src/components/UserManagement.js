import React, { useState, useEffect } from 'react';
import { usersAPI } from '../api';

const UserManagement = ({ user }) => {
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assign');

  const [assignmentForm, setAssignmentForm] = useState({
    lecturer_id: '',
    class_id: '',
    course_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lecturersRes, studentsRes, classesRes, coursesRes] = await Promise.all([
        usersAPI.getLecturers(),
        usersAPI.getStudents(),
        usersAPI.getClasses(),
        usersAPI.getCourses()
      ]);

      setLecturers(lecturersRes.data.lecturers || []);
      setStudents(studentsRes.data.students || []);
      setClasses(classesRes.data.classes || []);
      setCourses(coursesRes.data.courses || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentChange = (e) => {
    setAssignmentForm({
      ...assignmentForm,
      [e.target.name]: e.target.value
    });
  };

  const handleAssignClass = async (e) => {
    e.preventDefault();
    
    if (!assignmentForm.lecturer_id || !assignmentForm.class_id || !assignmentForm.course_id) {
      alert('Please fill all fields');
      return;
    }

    try {
      await usersAPI.assignClass(assignmentForm);
      alert('Class assigned successfully!');
      setAssignmentForm({
        lecturer_id: '',
        class_id: '',
        course_id: ''
      });
    } catch (error) {
      alert('Failed to assign class: ' + (error.response?.data?.error || 'Please try again.'));
    }
  };

  const downloadUserData = (users, type) => {
    const data = users.map(user => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Faculty: user.faculty,
      Class: user.class_name || 'N/A',
      'Registered Date': new Date(user.created_at).toLocaleDateString()
    }));

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luct-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="loading">Loading user management...</div>;
  }

  return (
    <div className="card">
      <h2>User Management - Program Leader</h2>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'assign' ? 'active' : ''}`}
          onClick={() => setActiveTab('assign')}
        >
          Assign Classes
        </button>
        <button 
          className={`nav-tab ${activeTab === 'lecturers' ? 'active' : ''}`}
          onClick={() => setActiveTab('lecturers')}
        >
          Lecturers ({lecturers.length})
        </button>
        <button 
          className={`nav-tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Students ({students.length})
        </button>
        <button 
          className={`nav-tab ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          Classes ({classes.length})
        </button>
      </div>

      <div className="tab-content">
        {/* Assign Classes Tab */}
        {activeTab === 'assign' && (
          <div>
            <h3>Assign Class to Lecturer</h3>
            <form onSubmit={handleAssignClass} style={{ maxWidth: '500px' }}>
              <div className="form-group">
                <label>Select Lecturer</label>
                <select
                  name="lecturer_id"
                  value={assignmentForm.lecturer_id}
                  onChange={handleAssignmentChange}
                  className="form-control"
                  required
                >
                  <option value="">Choose Lecturer</option>
                  {lecturers.map(lecturer => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.name} ({lecturer.role.toUpperCase()} - {lecturer.faculty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Class</label>
                <select
                  name="class_id"
                  value={assignmentForm.class_id}
                  onChange={handleAssignmentChange}
                  className="form-control"
                  required
                >
                  <option value="">Choose Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.faculty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Course</label>
                <select
                  name="course_id"
                  value={assignmentForm.course_id}
                  onChange={handleAssignmentChange}
                  className="form-control"
                  required
                >
                  <option value="">Choose Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code} - {course.faculty})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                Assign Class
              </button>
            </form>
          </div>
        )}

        {/* Lecturers Tab */}
        {activeTab === 'lecturers' && (
          <div>
            <div className="action-buttons" style={{ marginBottom: '1rem' }}>
              <button 
                className="btn btn-success"
                onClick={() => downloadUserData(lecturers, 'lecturers')}
              >
                Download Lecturers Data
              </button>
            </div>
            
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Faculty</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map(lecturer => (
                  <tr key={lecturer.id}>
                    <td>{lecturer.name}</td>
                    <td>{lecturer.email}</td>
                    <td>{lecturer.role.toUpperCase()}</td>
                    <td>{lecturer.faculty}</td>
                    <td>{new Date(lecturer.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div>
            <div className="action-buttons" style={{ marginBottom: '1rem' }}>
              <button 
                className="btn btn-success"
                onClick={() => downloadUserData(students, 'students')}
              >
                Download Students Data
              </button>
            </div>
            
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Faculty</th>
                  <th>Class</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.faculty}</td>
                    <td>{student.class_name || 'Not assigned'}</td>
                    <td>{new Date(student.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div>
            <table className="table">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Faculty</th>
                  <th>Program Leader</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.id}>
                    <td>{cls.name}</td>
                    <td>{cls.faculty}</td>
                    <td>{cls.program_leader_id ? 'Assigned' : 'Not assigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="action-buttons" style={{ marginTop: '2rem' }}>
        <a href="/dashboard" className="btn btn-danger">Back to Dashboard</a>
      </div>
    </div>
  );
};

export default UserManagement;