const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// ==================== MOCK DATA ====================

// Mock users for testing
const mockUsers = [
  { id: 1, name: 'Test Student', email: 'student@luct.ac.ls', role: 'student', faculty: 'FICT', program: 'Information Technology', class_id: 1 },
  { id: 2, name: 'Test Lecturer', email: 'lecturer@luct.ac.ls', role: 'lecturer', faculty: 'FICT', program: 'Information Technology' },
  { id: 3, name: 'PRL FICT', email: 'prl@fict.luct.ac.ls', role: 'prl', faculty: 'FICT', program: 'Information Technology' },
  { id: 4, name: 'PL Admin', email: 'pl@luct.ac.ls', role: 'pl', faculty: 'FICT', program: 'Information Technology' },
  { id: 5, name: 'FMG Director', email: 'fmg@luct.ac.ls', role: 'fmg', faculty: 'FICT', program: 'Information Technology' }
];

// Mock classes for testing
const mockClasses = [
  { id: 1, class_name: 'IT Year 1', faculty: 'FICT', program: 'Information Technology', total_students: 50, assigned_lecturer_id: 2 },
  { id: 2, class_name: 'IT Year 2', faculty: 'FICT', program: 'Information Technology', total_students: 45, assigned_lecturer_id: null },
  { id: 3, class_name: 'BIT Year 1', faculty: 'FICT', program: 'Business IT', total_students: 40, assigned_lecturer_id: null }
];

// Mock courses for testing
const mockCourses = [
  { id: 1, course_code: 'DIWA2110', course_name: 'Web Application Development', faculty: 'FICT', program: 'Information Technology', assigned_lecturer_id: 2 },
  { id: 2, course_code: 'DIPR2110', course_name: 'Programming Fundamentals', faculty: 'FICT', program: 'Information Technology', assigned_lecturer_id: null },
  { id: 3, course_code: 'DIDS2110', course_name: 'Database Systems', faculty: 'FICT', program: 'Information Technology', assigned_lecturer_id: null }
];

// Mock reports data
const mockReports = [
  {
    id: 1,
    faculty: 'FICT',
    class_name: 'IT Year 1',
    week_of_reporting: 'Week 6',
    date_of_lecture: '2024-01-15',
    course_name: 'Web Application Development',
    course_code: 'DIWA2110',
    lecturer_id: 2,
    lecturer_name: 'Test Lecturer',
    students_present: 45,
    total_students: 50,
    venue: 'Room 101',
    scheduled_time: '10:00',
    topic_taught: 'React Components and Props',
    learning_outcomes: 'Understanding React component structure and props passing',
    recommendations: 'More practical examples needed',
    status: 'pending',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    faculty: 'FICT',
    class_name: 'IT Year 2',
    week_of_reporting: 'Week 6',
    date_of_lecture: '2024-01-16',
    course_name: 'Database Systems',
    course_code: 'DIDS2110',
    lecturer_id: 2,
    lecturer_name: 'Test Lecturer',
    students_present: 40,
    total_students: 45,
    venue: 'Lab 201',
    scheduled_time: '14:00',
    topic_taught: 'SQL Queries and Joins',
    learning_outcomes: 'Mastering SQL JOIN operations and complex queries',
    recommendations: 'Provide more exercises on complex joins',
    status: 'student_approved',
    student_signature: 'data:image/signature...',
    created_at: new Date().toISOString()
  }
];

// Mock complaints data
const mockComplaints = [
  {
    id: 1,
    complainant_id: 1,
    complainant_name: 'Test Student',
    complainant_role: 'student',
    complaint_against_id: 2,
    complaint_against_name: 'Test Lecturer',
    complaint_against_role: 'lecturer',
    complaint_text: 'The lecturer is not covering the syllabus topics properly.',
    faculty: 'FICT',
    status: 'pending',
    created_at: new Date().toISOString()
  }
];

// Mock ratings data
const mockRatings = [
  {
    id: 1,
    report_id: 1,
    student_id: 1,
    student_name: 'Test Student',
    lecturer_id: 2,
    lecturer_name: 'Test Lecturer',
    rating: 4,
    comment: 'Great lecture, very informative',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    report_id: 2,
    student_id: 1,
    student_name: 'Test Student',
    lecturer_id: 2,
    lecturer_name: 'Test Lecturer',
    rating: 5,
    comment: 'Excellent teaching methodology',
    created_at: new Date().toISOString()
  }
];

// Mock monitoring data
const mockMonitoring = [
  {
    id: 1,
    faculty: 'FICT',
    total_reports: 15,
    pending_reports: 3,
    approved_reports: 10,
    average_attendance: 85,
    complaints_received: 2,
    period: 'January 2024'
  },
  {
    id: 2,
    faculty: 'FBMG',
    total_reports: 12,
    pending_reports: 2,
    approved_reports: 8,
    average_attendance: 78,
    complaints_received: 1,
    period: 'January 2024'
  }
];

// ==================== BASIC ROUTES ====================

// Test route - ALWAYS WORKS
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 LUCT Reporting System Backend is RUNNING!',
    timestamp: new Date().toISOString(),
    status: 'ACTIVE',
    port: PORT,
    database: process.env.DB_NAME,
    frontend_url: 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    res.json({ 
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString(),
      server: 'LUCT Reporting System Backend',
      port: PORT
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      database: 'Disconnected',
      error: error.message
    });
  }
});

// ==================== AUTH ROUTES ====================

// Test classes route
app.get('/api/courses/classes', (req, res) => {
  res.json(mockClasses);
});

// Get courses
app.get('/api/courses', (req, res) => {
  res.json(mockCourses);
});

// Simple register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, faculty, class_id, program } = req.body;
    
    console.log('Registration attempt:', { name, email, role, faculty });
    
    // Simple validation
    if (!name || !email || !password || !role || !faculty) {
      return res.status(400).json({ error: 'All required fields are missing' });
    }

    // Check if user already exists
    const existingUser = mockUsers.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user (in real app, hash password)
    const newUser = {
      id: mockUsers.length + 1,
      name,
      email,
      role,
      faculty,
      class_id: class_id || null,
      program: program || 'Not specified',
      created_at: new Date().toISOString()
    };

    mockUsers.push(newUser);

    // Generate mock token
    const token = 'mock-jwt-token-' + Date.now();

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Simple login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Mock login - accept any credentials for testing
    const user = mockUsers.find(u => u.email === email) || {
      id: 1,
      name: 'Test User',
      email: email,
      role: 'student',
      faculty: 'FICT',
      program: 'Information Technology',
      class_id: 1,
      created_at: new Date().toISOString()
    };

    const token = 'mock-jwt-token-' + Date.now();

    res.json({
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Simple profile endpoint
app.get('/api/auth/profile', (req, res) => {
  // Mock user profile
  const user = {
    id: 1,
    name: 'Test User',
    email: 'test@luct.ac.ls',
    role: 'student',
    faculty: 'FICT',
    program: 'Information Technology',
    class_id: 1,
    created_at: new Date().toISOString()
  };

  res.json({ user });
});

// ==================== REPORTS ROUTES ====================

// Get all reports
app.get('/api/reports/all', (req, res) => {
  console.log('📊 Fetching all reports');
  res.json(mockReports);
});

// Get my reports
app.get('/api/reports/my-reports', (req, res) => {
  console.log('📊 Fetching my reports');
  // For testing, return all reports for lecturer_id 2
  const myReports = mockReports.filter(report => report.lecturer_id === 2);
  res.json(myReports);
});

// Create new report
app.post('/api/reports', (req, res) => {
  try {
    const {
      faculty, class_name, week_of_reporting, date_of_lecture, course_name,
      course_code, students_present, total_students, venue, scheduled_time,
      topic_taught, learning_outcomes, recommendations
    } = req.body;

    console.log('📝 Creating new report:', { course_code, class_name });

    // Validation
    if (!faculty || !class_name || !course_name || !course_code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newReport = {
      id: mockReports.length + 1,
      faculty,
      class_name,
      week_of_reporting,
      date_of_lecture,
      course_name,
      course_code,
      lecturer_id: 2, // Mock lecturer ID
      lecturer_name: 'Test Lecturer',
      students_present: parseInt(students_present),
      total_students: parseInt(total_students),
      venue,
      scheduled_time,
      topic_taught,
      learning_outcomes,
      recommendations: recommendations || '',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    mockReports.push(newReport);

    res.status(201).json({
      message: 'Report created successfully',
      report: newReport
    });

  } catch (error) {
    console.error('Report creation error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Approve report
app.patch('/api/reports/:reportId/approve', (req, res) => {
  try {
    const { reportId } = req.params;
    const { signature } = req.body;

    console.log('✅ Approving report:', reportId);

    const report = mockReports.find(r => r.id === parseInt(reportId));
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.status = 'student_approved';
    report.student_signature = signature;
    report.student_approved = true;

    res.json({
      message: 'Report approved successfully',
      report
    });

  } catch (error) {
    console.error('Report approval error:', error);
    res.status(500).json({ error: 'Failed to approve report' });
  }
});

// Add PRL feedback
app.patch('/api/reports/:reportId/feedback', (req, res) => {
  try {
    const { reportId } = req.params;
    const { feedback } = req.body;

    console.log('📝 Adding PRL feedback to report:', reportId);

    const report = mockReports.find(r => r.id === parseInt(reportId));
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.status = 'prl_approved';
    report.prl_feedback = feedback;

    res.json({
      message: 'Feedback added successfully',
      report
    });

  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to add feedback' });
  }
});

// ==================== COMPLAINTS ROUTES ====================

// Get my complaints
app.get('/api/complaints/my-complaints', (req, res) => {
  console.log('📋 Fetching my complaints');
  // For testing, return complaints for user_id 1
  const myComplaints = mockComplaints.filter(complaint => complaint.complainant_id === 1);
  res.json(myComplaints);
});

// Get complaints against me
app.get('/api/complaints/against-me', (req, res) => {
  console.log('📋 Fetching complaints against me');
  // For testing, return complaints against user_id 2
  const complaintsAgainstMe = mockComplaints.filter(complaint => complaint.complaint_against_id === 2);
  res.json(complaintsAgainstMe);
});

// Create new complaint
app.post('/api/complaints', (req, res) => {
  try {
    const { complaint_against_id, complaint_text } = req.body;

    console.log('📨 Creating new complaint against:', complaint_against_id);

    if (!complaint_against_id || !complaint_text) {
      return res.status(400).json({ error: 'Complaint against and text are required' });
    }

    const complaintAgainst = mockUsers.find(user => user.id === parseInt(complaint_against_id));
    if (!complaintAgainst) {
      return res.status(404).json({ error: 'User to complain against not found' });
    }

    const newComplaint = {
      id: mockComplaints.length + 1,
      complainant_id: 1, // Mock student ID
      complainant_name: 'Test Student',
      complainant_role: 'student',
      complaint_against_id: parseInt(complaint_against_id),
      complaint_against_name: complaintAgainst.name,
      complaint_against_role: complaintAgainst.role,
      complaint_text,
      faculty: 'FICT',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    mockComplaints.push(newComplaint);

    res.status(201).json({
      message: 'Complaint filed successfully',
      complaint: newComplaint
    });

  } catch (error) {
    console.error('Complaint creation error:', error);
    res.status(500).json({ error: 'Failed to file complaint' });
  }
});

// Respond to complaint
app.patch('/api/complaints/:complaintId/respond', (req, res) => {
  try {
    const { complaintId } = req.params;
    const { response_text } = req.body;

    console.log('📝 Responding to complaint:', complaintId);

    const complaint = mockComplaints.find(c => c.id === parseInt(complaintId));
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    complaint.response_text = response_text;
    complaint.status = 'reviewed';
    complaint.responded_by = 2; // Mock lecturer ID

    res.json({
      message: 'Response added successfully',
      complaint
    });

  } catch (error) {
    console.error('Complaint response error:', error);
    res.status(500).json({ error: 'Failed to respond to complaint' });
  }
});

// ==================== RATING ROUTES ====================

// Get ratings for a lecturer
app.get('/api/ratings/my-ratings', (req, res) => {
  console.log('⭐ Fetching my ratings');
  const myRatings = mockRatings.filter(rating => rating.lecturer_id === 2);
  res.json(myRatings);
});

// Get ratings I've given
app.get('/api/ratings/given', (req, res) => {
  console.log('⭐ Fetching ratings I gave');
  const givenRatings = mockRatings.filter(rating => rating.student_id === 1);
  res.json(givenRatings);
});

// Submit a rating
app.post('/api/ratings', (req, res) => {
  try {
    const { report_id, rating, comment } = req.body;

    console.log('⭐ Submitting rating for report:', report_id);

    if (!report_id || !rating) {
      return res.status(400).json({ error: 'Report ID and rating are required' });
    }

    const report = mockReports.find(r => r.id === parseInt(report_id));
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const newRating = {
      id: mockRatings.length + 1,
      report_id: parseInt(report_id),
      student_id: 1, // Mock student ID
      student_name: 'Test Student',
      lecturer_id: report.lecturer_id,
      lecturer_name: report.lecturer_name,
      rating: parseInt(rating),
      comment: comment || '',
      created_at: new Date().toISOString()
    };

    mockRatings.push(newRating);

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: newRating
    });

  } catch (error) {
    console.error('Rating submission error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Get average rating for lecturer
app.get('/api/ratings/lecturer/:lecturerId', (req, res) => {
  const { lecturerId } = req.params;
  console.log('⭐ Fetching average rating for lecturer:', lecturerId);

  const lecturerRatings = mockRatings.filter(r => r.lecturer_id === parseInt(lecturerId));
  const averageRating = lecturerRatings.length > 0 
    ? lecturerRatings.reduce((sum, r) => sum + r.rating, 0) / lecturerRatings.length 
    : 0;

  res.json({
    lecturer_id: parseInt(lecturerId),
    average_rating: Math.round(averageRating * 10) / 10,
    total_ratings: lecturerRatings.length,
    ratings: lecturerRatings
  });
});

// ==================== MONITORING ROUTES ====================

// Get monitoring data
app.get('/api/monitoring', (req, res) => {
  console.log('📈 Fetching monitoring data');
  
  // Calculate real-time stats from mock data
  const monitoringData = {
    overall: {
      total_reports: mockReports.length,
      pending_reports: mockReports.filter(r => r.status === 'pending').length,
      approved_reports: mockReports.filter(r => r.status === 'student_approved' || r.status === 'prl_approved').length,
      total_complaints: mockComplaints.length,
      pending_complaints: mockComplaints.filter(c => c.status === 'pending').length,
      average_attendance: mockReports.length > 0 
        ? Math.round(mockReports.reduce((sum, r) => sum + (r.students_present / r.total_students * 100), 0) / mockReports.length)
        : 0
    },
    by_faculty: mockMonitoring,
    recent_activity: [
      {
        type: 'report_created',
        description: 'New report created for Web Development',
        timestamp: new Date().toISOString(),
        user: 'Test Lecturer'
      },
      {
        type: 'report_approved',
        description: 'Report approved by student representative',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user: 'Test Student'
      },
      {
        type: 'complaint_filed',
        description: 'New complaint filed',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        user: 'Test Student'
      }
    ]
  };

  res.json(monitoringData);
});

// Get faculty-specific monitoring
app.get('/api/monitoring/faculty/:faculty', (req, res) => {
  const { faculty } = req.params;
  console.log('📈 Fetching monitoring data for faculty:', faculty);

  const facultyReports = mockReports.filter(r => r.faculty === faculty.toUpperCase());
  const facultyComplaints = mockComplaints.filter(c => c.faculty === faculty.toUpperCase());

  const facultyData = {
    faculty: faculty.toUpperCase(),
    reports: {
      total: facultyReports.length,
      pending: facultyReports.filter(r => r.status === 'pending').length,
      approved: facultyReports.filter(r => r.status === 'student_approved' || r.status === 'prl_approved').length,
      attendance_rate: facultyReports.length > 0 
        ? Math.round(facultyReports.reduce((sum, r) => sum + (r.students_present / r.total_students * 100), 0) / facultyReports.length)
        : 0
    },
    complaints: {
      total: facultyComplaints.length,
      pending: facultyComplaints.filter(c => c.status === 'pending').length,
      resolved: facultyComplaints.filter(c => c.status === 'reviewed' || c.status === 'resolved').length
    },
    ratings: {
      average: mockRatings.length > 0 
        ? Math.round(mockRatings.reduce((sum, r) => sum + r.rating, 0) / mockRatings.length * 10) / 10
        : 0,
      total: mockRatings.length
    }
  };

  res.json(facultyData);
});

// ==================== USERS ROUTES ====================

// Get users by role
app.get('/api/users/role/:role', (req, res) => {
  const { role } = req.params;
  console.log('👥 Fetching users with role:', role);
  
  const usersByRole = mockUsers.filter(user => user.role === role);
  res.json(usersByRole);
});

// Get all users (for PL and FMG)
app.get('/api/users', (req, res) => {
  console.log('👥 Fetching all users');
  res.json(mockUsers);
});

// ==================== COURSE MANAGEMENT ROUTES ====================

// Assign course to lecturer
app.post('/api/courses/assign-course', (req, res) => {
  try {
    const { courseId, lecturerId } = req.body;
    console.log('📚 Assigning course:', courseId, 'to lecturer:', lecturerId);
    
    // Update the course assignment in mock data
    const course = mockCourses.find(c => c.id === parseInt(courseId));
    if (course) {
      course.assigned_lecturer_id = parseInt(lecturerId);
    }
    
    res.json({
      message: 'Course assigned successfully',
      course: course
    });
  } catch (error) {
    console.error('Course assignment error:', error);
    res.status(500).json({ error: 'Failed to assign course' });
  }
});

// Assign class to lecturer
app.post('/api/courses/assign-class', (req, res) => {
  try {
    const { classId, lecturerId } = req.body;
    console.log('🏫 Assigning class:', classId, 'to lecturer:', lecturerId);
    
    // Update the class assignment in mock data
    const classItem = mockClasses.find(c => c.id === parseInt(classId));
    if (classItem) {
      classItem.assigned_lecturer_id = parseInt(lecturerId);
    }
    
    res.json({
      message: 'Class assigned successfully',
      class: classItem
    });
  } catch (error) {
    console.error('Class assignment error:', error);
    res.status(500).json({ error: 'Failed to assign class' });
  }
});

// ==================== EXPORT/EXCEL ROUTES ====================

// Export my reports to Excel format
app.get('/api/export/my-reports', (req, res) => {
  try {
    console.log('📊 Exporting my reports to Excel format');
    
    // For lecturer, get their reports; for student, get all reports they can see
    const myReports = mockReports.filter(report => report.lecturer_id === 2);

    const excelData = {
      filename: `my-reports-${new Date().toISOString().split('T')[0]}.xlsx`,
      data: myReports.map(report => ({
        'Course Code': report.course_code,
        'Course Name': report.course_name,
        'Class': report.class_name,
        'Week': report.week_of_reporting,
        'Date': report.date_of_lecture,
        'Students Present': report.students_present,
        'Total Students': report.total_students,
        'Attendance Rate': `${Math.round((report.students_present / report.total_students) * 100)}%`,
        'Venue': report.venue,
        'Time': report.scheduled_time,
        'Topic': report.topic_taught,
        'Status': report.status,
        'Created Date': new Date(report.created_at).toLocaleDateString()
      }))
    };

    res.json(excelData);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export reports' });
  }
});

// Export all data for admin
app.get('/api/export/all-data', (req, res) => {
  try {
    console.log('📊 Exporting all system data');
    
    const exportData = {
      filename: `luct-system-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      sheets: {
        'Reports': mockReports.map(report => ({
          'ID': report.id,
          'Course Code': report.course_code,
          'Course Name': report.course_name,
          'Class': report.class_name,
          'Faculty': report.faculty,
          'Week': report.week_of_reporting,
          'Date': report.date_of_lecture,
          'Lecturer': report.lecturer_name,
          'Students Present': report.students_present,
          'Total Students': report.total_students,
          'Attendance Rate': `${Math.round((report.students_present / report.total_students) * 100)}%`,
          'Venue': report.venue,
          'Status': report.status,
          'Created Date': new Date(report.created_at).toLocaleDateString()
        })),
        'Complaints': mockComplaints.map(complaint => ({
          'ID': complaint.id,
          'Complainant': complaint.complainant_name,
          'Complaint Against': complaint.complaint_against_name,
          'Faculty': complaint.faculty,
          'Status': complaint.status,
          'Created Date': new Date(complaint.created_at).toLocaleDateString()
        })),
        'Ratings': mockRatings.map(rating => ({
          'ID': rating.id,
          'Lecturer': rating.lecturer_name,
          'Student': rating.student_name,
          'Rating': rating.rating,
          'Comment': rating.comment,
          'Date': new Date(rating.created_at).toLocaleDateString()
        }))
      }
    };

    res.json(exportData);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Export monitoring data
app.get('/api/export/monitoring', (req, res) => {
  try {
    console.log('📊 Exporting monitoring data');
    
    const facultyReports = mockReports.reduce((acc, report) => {
      if (!acc[report.faculty]) {
        acc[report.faculty] = [];
      }
      acc[report.faculty].push(report);
      return acc;
    }, {});

    const monitoringData = {
      filename: `monitoring-report-${new Date().toISOString().split('T')[0]}.xlsx`,
      data: Object.entries(facultyReports).map(([faculty, reports]) => ({
        'Faculty': faculty,
        'Total Reports': reports.length,
        'Pending Reports': reports.filter(r => r.status === 'pending').length,
        'Approved Reports': reports.filter(r => r.status === 'student_approved' || r.status === 'prl_approved').length,
        'Average Attendance': `${Math.round(reports.reduce((sum, r) => sum + (r.students_present / r.total_students * 100), 0) / reports.length)}%`,
        'Complaints': mockComplaints.filter(c => c.faculty === faculty).length
      }))
    };

    res.json(monitoringData);

  } catch (error) {
    console.error('Monitoring export error:', error);
    res.status(500).json({ error: 'Failed to export monitoring data' });
  }
});

// ==================== CLIENT ROUTING FALLBACK ====================

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// ==================== ERROR HANDLING ====================

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API route not found',
    path: req.originalUrl,
    available_routes: [
      'GET  /',
      'GET  /api/health',
      'GET  /api/courses/classes',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/profile',
      'GET  /api/reports/all',
      'GET  /api/reports/my-reports',
      'POST /api/reports',
      'GET  /api/complaints/my-complaints',
      'GET  /api/complaints/against-me',
      'POST /api/complaints',
      'GET  /api/ratings/my-ratings',
      'GET  /api/ratings/given',
      'POST /api/ratings',
      'GET  /api/monitoring',
      'GET  /api/export/my-reports',
      'GET  /api/export/all-data',
      'GET  /api/export/monitoring'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// ==================== START SERVER ====================

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('🚀 LUCT REPORTING SYSTEM BACKEND - COMPLETE VERSION');
  console.log('='.repeat(70));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(70));
  console.log('📋 ALL MODULES AVAILABLE:');
  console.log('   ✅ Authentication');
  console.log('   ✅ Reports Management');
  console.log('   ✅ Complaints System');
  console.log('   ✅ Rating System');
  console.log('   ✅ Monitoring Dashboard');
  console.log('   ✅ Excel Export');
  console.log('   ✅ Course Management');
  console.log('='.repeat(70));
  console.log('💡 Frontend should be running on: http://localhost:3000');
  console.log('💡 Test backend API: http://localhost:5001/api/health');
  console.log('='.repeat(70));
});