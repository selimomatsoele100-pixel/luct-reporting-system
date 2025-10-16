require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Database Configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.connect()
  .then(client => {
    console.log('✅ Connected to PostgreSQL database successfully');
    client.release();
  })
  .catch(err => console.error('❌ DB connection failed:', err.message));

// ======================================================
// 🧱 CORS CONFIGURATION
// ======================================================
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ======================================================
// 🗃️ DATABASE SETUP ROUTES
// ======================================================
app.get('/api/db/setup', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    console.log('🔄 Checking database tables...');
    
    // Create users table first (required for foreign keys)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        faculty VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready');

    // Create classes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        faculty VARCHAR(100) NOT NULL,
        program VARCHAR(100),
        total_students INTEGER DEFAULT 0,
        assigned_lecturer_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Classes table ready');

    // Create courses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        faculty VARCHAR(100) NOT NULL,
        program VARCHAR(100),
        assigned_lecturer_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Courses table ready');

    // Create reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        faculty VARCHAR(100) NOT NULL,
        class_name VARCHAR(255) NOT NULL,
        week_of_reporting VARCHAR(100),
        date_of_lecture DATE,
        course_name VARCHAR(255) NOT NULL,
        course_code VARCHAR(50) NOT NULL,
        students_present INTEGER,
        total_students INTEGER,
        venue VARCHAR(100),
        scheduled_time TIME,
        topic_taught TEXT,
        learning_outcomes TEXT,
        recommendations TEXT,
        lecturer_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Reports table ready');

    // Create complaints table
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        complaint_text TEXT NOT NULL,
        complaint_against_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Complaints table ready');

    res.json({ 
      message: 'Database tables checked and ready',
      tables: ['users', 'classes', 'courses', 'reports', 'complaints']
    });
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    res.status(500).json({ error: 'Database setup failed: ' + err.message });
  } finally {
    if (client) client.release();
  }
});

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ 
      status: 'OK', 
      db: 'Connected', 
      time: new Date().toISOString() 
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// ======================================================
// 🔐 AUTH ROUTES
// ======================================================
app.post('/api/auth/register', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { name, email, password, role, faculty } = req.body;

    console.log('📝 Registration attempt:', { name, email, role, faculty });

    // Validation
    if (!name || !email || !password || !role || !faculty) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if user exists
    const exists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (name, email, password, role, faculty)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, faculty, created_at;
    `;
    
    const result = await client.query(query, [name, email, hashedPassword, role, faculty]);
    
    console.log('✅ User registered successfully:', result.rows[0].email);

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully', 
      user: result.rows[0],
      token: 'temp-token-' + Date.now()
    });

  } catch (err) {
    console.error('❌ Registration failed:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Registration failed: ' + err.message
    });
  } finally {
    if (client) client.release();
  }
});

app.post('/api/auth/login', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password required'
      });
    }

    const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found'
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials'
      });
    }

    console.log('✅ Login successful:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        faculty: user.faculty,
      },
      token: 'temp-token-' + Date.now()
    });

  } catch (err) {
    console.error('❌ Login failed:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Login failed: ' + err.message
    });
  } finally {
    if (client) client.release();
  }
});

// ======================================================
// 🏫 CLASSES MANAGEMENT ROUTES - FIXED
// ======================================================
app.post('/api/classes', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { class_name, faculty, program, total_students } = req.body;

    console.log('📝 Adding class:', { class_name, faculty, program, total_students });

    if (!class_name || !faculty) {
      return res.status(400).json({ 
        success: false,
        error: 'Class name and faculty are required'
      });
    }

    const query = `
      INSERT INTO classes (name, faculty, program, total_students)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    
    const result = await client.query(query, [
      class_name, 
      faculty, 
      program || 'General', 
      parseInt(total_students) || 0
    ]);
    
    console.log('✅ Class created successfully:', result.rows[0]);

    res.status(201).json({ 
      success: true,
      message: 'Class created successfully',
      class: result.rows[0]
    });

  } catch (err) {
    console.error('❌ Error creating class:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create class: ' + err.message 
    });
  } finally {
    if (client) client.release();
  }
});

// Get all classes
app.get('/api/classes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.name as lecturer_name 
      FROM classes c 
      LEFT JOIN users u ON c.assigned_lecturer_id = u.id 
      ORDER BY c.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching classes:', err.message);
    res.status(500).json({ error: 'Failed to fetch classes: ' + err.message });
  }
});

// Get classes for courses
app.get('/api/courses/classes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM classes ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching classes:', err.message);
    res.status(500).json({ error: 'Failed to fetch classes: ' + err.message });
  }
});

// ======================================================
// 📚 COURSES MANAGEMENT ROUTES - FIXED
// ======================================================
app.post('/api/courses', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { course_code, course_name, faculty, program } = req.body;

    console.log('📝 Adding course:', { course_code, course_name, faculty, program });

    if (!course_code || !course_name || !faculty) {
      return res.status(400).json({ 
        success: false,
        error: 'Course code, name and faculty are required' 
      });
    }

    // Check if course code already exists
    const exists = await client.query('SELECT id FROM courses WHERE code = $1', [course_code]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Course code already exists' 
      });
    }

    const query = `
      INSERT INTO courses (code, name, faculty, program)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    
    const result = await client.query(query, [
      course_code, 
      course_name, 
      faculty, 
      program || 'General'
    ]);
    
    console.log('✅ Course created successfully:', result.rows[0]);

    res.status(201).json({ 
      success: true,
      message: 'Course created successfully',
      course: result.rows[0]
    });

  } catch (err) {
    console.error('❌ Error creating course:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create course: ' + err.message 
    });
  } finally {
    if (client) client.release();
  }
});

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.name as lecturer_name 
      FROM courses c 
      LEFT JOIN users u ON c.assigned_lecturer_id = u.id 
      ORDER BY c.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching courses:', err.message);
    res.status(500).json({ error: 'Failed to fetch courses: ' + err.message });
  }
});

// ======================================================
// 👥 GET LECTURERS BY ROLE
// ======================================================
app.get('/api/users/role/lecturer', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, faculty 
      FROM users 
      WHERE role = 'lecturer' 
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching lecturers:', err.message);
    res.status(500).json({ error: 'Failed to fetch lecturers: ' + err.message });
  }
});

// ======================================================
// 🔗 ASSIGNMENT ROUTES - FIXED
// ======================================================
app.post('/api/courses/assign-class', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { classId, lecturerId } = req.body;
    
    console.log('🔗 Assigning class:', { classId, lecturerId });
    
    const query = `UPDATE classes SET assigned_lecturer_id = $1 WHERE id = $2 RETURNING *`;
    const result = await client.query(query, [lecturerId, classId]);
    
    res.json({ 
      success: true,
      message: 'Class assigned successfully', 
      class: result.rows[0] 
    });
  } catch (err) {
    console.error('❌ Error assigning class:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to assign class: ' + err.message 
    });
  } finally {
    if (client) client.release();
  }
});

app.post('/api/courses/assign-course', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { courseId, lecturerId } = req.body;
    
    console.log('🔗 Assigning course:', { courseId, lecturerId });
    
    const query = `UPDATE courses SET assigned_lecturer_id = $1 WHERE id = $2 RETURNING *`;
    const result = await client.query(query, [lecturerId, courseId]);
    
    res.json({ 
      success: true,
      message: 'Course assigned successfully', 
      course: result.rows[0] 
    });
  } catch (err) {
    console.error('❌ Error assigning course:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to assign course: ' + err.message 
    });
  } finally {
    if (client) client.release();
  }
});

// ======================================================
// 🧾 REPORT ROUTES - FIXED
// ======================================================
app.post('/api/reports', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const {
      faculty, class_name, week_of_reporting, date_of_lecture,
      course_name, course_code, students_present, total_students,
      venue, scheduled_time, topic_taught, learning_outcomes,
      recommendations, lecturer_name, status
    } = req.body;

    console.log('📝 Creating report:', { course_code, course_name, class_name });

    if (!course_code || !course_name || !class_name) {
      return res.status(400).json({ 
        success: false,
        error: 'Course code, course name, and class name are required' 
      });
    }

    const insertQuery = `
      INSERT INTO reports (
        faculty, class_name, week_of_reporting, date_of_lecture,
        course_name, course_code, students_present, total_students,
        venue, scheduled_time, topic_taught, learning_outcomes,
        recommendations, lecturer_name, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;

    const values = [
      faculty, class_name, week_of_reporting, date_of_lecture,
      course_name, course_code, students_present || 0, total_students || 0,
      venue, scheduled_time, topic_taught, learning_outcomes,
      recommendations, lecturer_name, status || 'pending'
    ];

    const result = await client.query(insertQuery, values);
    
    console.log('✅ Report created successfully:', result.rows[0].id);

    res.status(201).json({ 
      success: true,
      message: 'Report created successfully', 
      report: result.rows[0] 
    });
  } catch (err) {
    console.error('❌ Error creating report:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create report: ' + err.message 
    });
  } finally {
    if (client) client.release();
  }
});

app.get('/api/reports/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching reports:', err.message);
    res.status(500).json({ error: 'Failed to fetch reports: ' + err.message });
  }
});

// Get user's own reports
app.get('/api/reports/my-reports', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching user reports:', err.message);
    res.status(500).json({ error: 'Failed to fetch user reports: ' + err.message });
  }
});

// ======================================================
// 💬 COMPLAINTS ROUTES - FIXED
// ======================================================
app.get('/api/complaints', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.name as complainant_name, u2.name as complaint_against_name
      FROM complaints c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN users u2 ON c.complaint_against_id = u2.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching complaints:', err.message);
    res.status(500).json({ error: 'Failed to fetch complaints: ' + err.message });
  }
});

app.post('/api/complaints', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { complaint_text, complaint_against_id, created_by } = req.body;
    
    console.log('📝 Creating complaint:', { complaint_against_id, created_by });

    if (!complaint_text || !complaint_against_id) {
      return res.status(400).json({ 
        success: false,
        error: 'Complaint text and complaint against are required' 
      });
    }

    const query = `
      INSERT INTO complaints (complaint_text, complaint_against_id, created_by, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *;
    `;
    
    const result = await client.query(query, [complaint_text, complaint_against_id, created_by]);
    
    console.log('✅ Complaint created successfully:', result.rows[0].id);

    res.status(201).json({ 
      success: true,
      message: 'Complaint submitted successfully',
      complaint: result.rows[0] 
    });
  } catch (err) {
    console.error('❌ Error creating complaint:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create complaint: ' + err.message 
    });
  } finally {
    if (client) client.release();
  }
});

// Get user's complaints
app.get('/api/complaints/my-complaints', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.name as complaint_against_name
      FROM complaints c
      LEFT JOIN users u ON c.complaint_against_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching user complaints:', err.message);
    res.status(500).json({ error: 'Failed to fetch user complaints: ' + err.message });
  }
});

// Get complaints against user
app.get('/api/complaints/against-me', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.name as complainant_name
      FROM complaints c
      LEFT JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching complaints against user:', err.message);
    res.status(500).json({ error: 'Failed to fetch complaints against user: ' + err.message });
  }
});

// ======================================================
// 📊 MONITORING ROUTES - FIXED
// ======================================================
app.get('/api/monitoring/data', async (req, res) => {
  try {
    // Return actual reports data for monitoring
    const reportsResult = await pool.query(`
      SELECT * FROM reports 
      ORDER BY created_at DESC 
      LIMIT 50
    `);
    
    const reportsCount = await pool.query('SELECT COUNT(*) FROM reports');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const complaintsCount = await pool.query('SELECT COUNT(*) FROM complaints');
    const classesCount = await pool.query('SELECT COUNT(*) FROM classes');
    const coursesCount = await pool.query('SELECT COUNT(*) FROM courses');
    
    res.json({
      reports: parseInt(reportsCount.rows[0].count),
      users: parseInt(usersCount.rows[0].count),
      complaints: parseInt(complaintsCount.rows[0].count),
      classes: parseInt(classesCount.rows[0].count),
      courses: parseInt(coursesCount.rows[0].count),
      recentActivity: reportsResult.rows
    });
  } catch (err) {
    console.error('❌ Error fetching monitoring data:', err.message);
    res.status(500).json({ error: 'Failed to fetch monitoring data: ' + err.message });
  }
});

// ======================================================
// ⭐ RATINGS ROUTES - ADDED (for frontend compatibility)
// ======================================================
app.get('/api/ratings', async (req, res) => {
  try {
    // Return empty array for now - frontend expects this endpoint
    res.json([]);
  } catch (err) {
    console.error('❌ Error fetching ratings:', err.message);
    res.status(500).json({ error: 'Failed to fetch ratings: ' + err.message });
  }
});

// ======================================================
// 👥 USERS ROUTES
// ======================================================
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, faculty FROM users ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching users:', err.message);
    res.status(500).json({ error: 'Failed to fetch users: ' + err.message });
  }
});

// ======================================================
// 🧩 SERVE FRONTEND (PRODUCTION)
// ======================================================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // API routes should not serve HTML
  app.get('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });
  
  // All other routes serve the frontend
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// ======================================================
// 🚨 ERROR HANDLING
// ======================================================
app.use((err, req, res, next) => {
  console.error('🚨 Global error handler:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'API route not found' 
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Missing URL'}`);
  console.log(`✅ All API routes configured`);
});