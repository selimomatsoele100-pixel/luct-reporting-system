import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navigation from '../components/Navigation';

const Classes = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [assigningClass, setAssigningClass] = useState(null);
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClass, setNewClass] = useState({
    class_name: '',
    faculty: '',
    program: '',
    total_students: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
    if (user?.role === 'pl') {
      fetchLecturers();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses/classes');
      // Handle both response formats
      const classesData = Array.isArray(response.data) ? response.data : (response.data.classes || []);
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
      alert('Error loading classes');
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

  const handleAssignClass = async (classId, lecturerId) => {
    if (!lecturerId) return;

    try {
      await api.post('/courses/assign-class', { classId, lecturerId });
      await fetchClasses();
      setAssigningClass(null);
      alert('Class assigned successfully!');
    } catch (error) {
      console.error('Error assigning class:', error);
      alert('Error assigning class');
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClass.class_name || !newClass.faculty) {
      alert('Class name and faculty are required');
      return;
    }

    try {
      await api.post('/classes', {
        ...newClass,
        total_students: parseInt(newClass.total_students) || 0
      });
      await fetchClasses();
      setNewClass({
        class_name: '',
        faculty: '',
        program: '',
        total_students: ''
      });
      setShowAddClass(false);
      alert('Class added successfully!');
    } catch (error) {
      console.error('Error adding class:', error);
      alert('Error adding class');
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
        <h1>Classes Management</h1>
        
        {/* Add Class Form for PL */}
        {user?.role === 'pl' && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Manage Classes</h3>
              <button 
                className="btn btn-success"
                onClick={() => setShowAddClass(!showAddClass)}
              >
                {showAddClass ? 'Cancel' : 'Add New Class'}
              </button>
            </div>
            
            {showAddClass && (
              <form onSubmit={handleAddClass} style={{ marginTop: '15px', padding: '15px', background: '#1a1a1a', borderRadius: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div className="form-group">
                    <label>Class Name *</label>
                    <input
                      type="text"
                      value={newClass.class_name}
                      onChange={(e) => setNewClass({...newClass, class_name: e.target.value})}
                      placeholder="e.g., BIT-1A, DIT-2B"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Faculty *</label>
                    <select
                      value={newClass.faculty}
                      onChange={(e) => setNewClass({...newClass, faculty: e.target.value})}
                      required
                    >
                      <option value="">Select Faculty</option>
                      <option value="FICT">FICT</option>
                      <option value="FBMG">FBMG</option>
                      <option value="FABE">FABE</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  <div className="form-group">
                    <label>Program</label>
                    <input
                      type="text"
                      value={newClass.program}
                      onChange={(e) => setNewClass({...newClass, program: e.target.value})}
                      placeholder="e.g., BIT, DIT, BBA"
                    />
                  </div>
                  <div className="form-group">
                    <label>Total Students</label>
                    <input
                      type="number"
                      value={newClass.total_students}
                      onChange={(e) => setNewClass({...newClass, total_students: e.target.value})}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Add Class
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="card">
          <h3>All Classes - {user?.faculty} Faculty</h3>
          
          {loading ? (
            <p>Loading classes...</p>
          ) : classes.length === 0 ? (
            <p>No classes found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Faculty</th>
                    <th>Program</th>
                    <th>Total Students</th>
                    <th>Assigned Lecturer</th>
                    {user?.role === 'pl' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {classes.map(classItem => (
                    <tr key={classItem.id}>
                      <td><strong>{classItem.name || classItem.class_name}</strong></td>
                      <td>{classItem.faculty}</td>
                      <td>{classItem.program || 'General'}</td>
                      <td>{classItem.total_students}</td>
                      <td>
                        {classItem.assigned_lecturer_id ? (
                          <span style={{ color: '#28a745' }}>
                            {getLecturerName(classItem.assigned_lecturer_id)}
                          </span>
                        ) : (
                          <span style={{ color: '#dc3545', fontStyle: 'italic' }}>
                            Not assigned
                          </span>
                        )}
                      </td>
                      {user?.role === 'pl' && (
                        <td>
                          {assigningClass === classItem.id ? (
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                              <select 
                                onChange={(e) => handleAssignClass(classItem.id, e.target.value)}
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
                                onClick={() => setAssigningClass(null)}
                                style={{ padding: '5px 10px' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => setAssigningClass(classItem.id)}
                              style={{ padding: '5px 10px' }}
                            >
                              {classItem.assigned_lecturer_id ? 'Reassign' : 'Assign'}
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

        {/* Class management info for PL */}
        {user?.role === 'pl' && (
          <div className="card">
            <h3>Class Assignment Guidelines</h3>
            <div style={{ lineHeight: '1.6' }}>
              <p>As a Program Leader, you can:</p>
              <ul style={{ paddingLeft: '20px', color: '#ccc' }}>
                <li>Add new classes to the system</li>
                <li>Assign lecturers to classes within your program</li>
                <li>Manage class sizes and student counts</li>
                <li>Reassign classes when necessary</li>
                <li>Ensure all classes have assigned lecturers</li>
              </ul>
              <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#888' }}>
                Note: Class assignments determine which lecturers can create reports for specific classes.
              </p>
            </div>
          </div>
        )}

        {/* View-only info for other roles */}
        {user?.role !== 'pl' && (
          <div className="card">
            <h3>Class Information</h3>
            <p>
              This page displays all classes in the {user?.faculty} faculty.
              {user?.role === 'lecturer' && ' Classes assigned to you will appear in your reporting options.'}
              {user?.role === 'prl' && ' You can monitor reports for all classes in your faculty.'}
              {user?.role === 'student' && ' You can see which classes are available in your program.'}
            </p>
            {user?.role === 'student' && (
              <div style={{ marginTop: '15px', padding: '10px', background: '#1a1a1a', borderRadius: '4px' }}>
                <p style={{ margin: 0, color: '#ccc' }}>
                  <strong>Your Class:</strong> {user?.class_id ? 
                    classes.find(c => c.id === user.class_id)?.name || classes.find(c => c.id === user.class_id)?.class_name || 'Not specified' 
                    : 'Not assigned to any class'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Classes;