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
// 🏫 CLASSES MANAGEMENT ROUTES
// ======================================================
app.post('/api/classes', async (req, res) => {
  try {
    const { class_name, faculty, program, total_students } = req.body;

    if (!class_name || !faculty) {
      return res.status(400).json({ error: 'Class name and faculty are required' });
    }

    const query = `
      INSERT INTO classes (name, faculty, program, total_students)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    
    const result = await pool.query(query, [class_name, faculty, program || 'General', total_students || 0]);
    
    res.status(201).json({ 
      message: 'Class created successfully',
      class: result.rows[0]
    });
  } catch (err) {
    console.error('❌ Error creating class:', err.message);
    res.status(500).json({ error: 'Failed to create class: ' + err.message });
  }
});

// ======================================================
// 📚 COURSES MANAGEMENT ROUTES
// ======================================================
app.post('/api/courses', async (req, res) => {
  try {
    const { course_code, course_name, faculty, program } = req.body;

    if (!course_code || !course_name || !faculty) {
      return res.status(400).json({ error: 'Course code, name and faculty are required' });
    }

    // Check if course code already exists
    const exists = await pool.query('SELECT id FROM courses WHERE code = $1', [course_code]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Course code already exists' });
    }

    const query = `
      INSERT INTO courses (code, name, faculty, program)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    
    const result = await pool.query(query, [course_code, course_name, faculty, program || 'General']);
    
    res.status(201).json({ 
      message: 'Course created successfully',
      course: result.rows[0]
    });
  } catch (err) {
    console.error('❌ Error creating course:', err.message);
    res.status(500).json({ error: 'Failed to create course: ' + err.message });
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
    res.status(500).json({ error: 'Failed to fetch lecturers' });
  }
});

// ======================================================
// 🔗 ASSIGNMENT ROUTES
// ======================================================
app.post('/api/courses/assign-class', async (req, res) => {
  try {
    const { classId, lecturerId } = req.body;
    
    const query = `UPDATE classes SET assigned_lecturer_id = $1 WHERE id = $2 RETURNING *`;
    const result = await pool.query(query, [lecturerId, classId]);
    
    res.json({ message: 'Class assigned successfully', class: result.rows[0] });
  } catch (err) {
    console.error('❌ Error assigning class:', err.message);
    res.status(500).json({ error: 'Failed to assign class' });
  }
});

app.post('/api/courses/assign-course', async (req, res) => {
  try {
    const { courseId, lecturerId } = req.body;
    
    const query = `UPDATE courses SET assigned_lecturer_id = $1 WHERE id = $2 RETURNING *`;
    const result = await pool.query(query, [lecturerId, courseId]);
    
    res.json({ message: 'Course assigned successfully', course: result.rows[0] });
  } catch (err) {
    console.error('❌ Error assigning course:', err.message);
    res.status(500).json({ error: 'Failed to assign course' });
  }
});

// ======================================================
// 🧾 REPORT ROUTES
// ======================================================
app.post('/api/reports', async (req, res) => {
  try {
    const {
      faculty, class_name, week_of_reporting, date_of_lecture,
      course_name, course_code, students_present, total_students,
      venue, scheduled_time, topic_taught, learning_outcomes,
      recommendations, lecturer_name, status
    } = req.body;

    if (!course_code || !course_name || !class_name) {
      return res.status(400).json({ error: 'Missing required fields' });
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
      course_name, course_code, students_present, total_students,
      venue, scheduled_time, topic_taught, learning_outcomes,
      recommendations, lecturer_name, status || 'pending'
    ];

    const result = await pool.query(insertQuery, values);
    res.status(201).json({ message: 'Report created successfully', report: result.rows[0] });
  } catch (err) {
    console.error('❌ Error inserting report:', err.message);
    res.status(500).json({ error: 'Failed to insert report' });
  }
});

app.get('/api/reports/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching reports:', err.message);
    res.json([]);
  }
});

// Get user's own reports
app.get('/api/reports/my-reports', async (req, res) => {
  try {
    // For now, return all reports until you implement user-specific logic
    const result = await pool.query('SELECT * FROM reports ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching user reports:', err.message);
    res.json([]);
  }
});

// ======================================================
// 🏫 CLASSES & COURSES ROUTES
// ======================================================
app.get('/api/courses/classes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM classes ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching classes:', err.message);
    res.json([]);
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses ORDER BY name');
    res.json(result.rows || []);
  } catch (err) {
    console.error('❌ Error fetching courses:', err.message);
    res.json([]);
  }
});

// ======================================================
// 💬 COMPLAINTS ROUTES
// ======================================================
app.get('/api/complaints', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(result.rows || []);
  } catch (err) {
    console.error('❌ Error fetching complaints:', err.message);
    res.json([]);
  }
});

app.post('/api/complaints', async (req, res) => {
  try {
    const { complaint_text, complaint_against_id } = req.body;
    if (!complaint_text || !complaint_against_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO complaints (complaint_text, complaint_against_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING *;
    `;
    const result = await pool.query(query, [complaint_text, complaint_against_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error creating complaint:', err.message);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// Get user's complaints
app.get('/api/complaints/my-complaints', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(result.rows || []);
  } catch (err) {
    console.error('❌ Error fetching user complaints:', err.message);
    res.json([]);
  }
});

// Get complaints against user
app.get('/api/complaints/against-me', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(result.rows || []);
  } catch (err) {
    console.error('❌ Error fetching complaints against user:', err.message);
    res.json([]);
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
    
    res.json({
      reports: parseInt(reportsCount.rows[0].count),
      users: parseInt(usersCount.rows[0].count),
      complaints: parseInt(complaintsCount.rows[0].count),
      recentActivity: reportsResult.rows // This is now an array for the frontend
    });
  } catch (err) {
    console.error('❌ Error fetching monitoring data:', err.message);
    res.json({
      reports: 0,
      users: 0,
      complaints: 0,
      recentActivity: [] // Always return array, not object
    });
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
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ======================================================
// 🧩 SERVE FRONTEND (PRODUCTION)
// ======================================================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
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