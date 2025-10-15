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

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://luct-reporting-system.vercel.app',
  'https://luct-reporting-system-lac.vercel.app',
  'https://luct-reporting-system-1bad.vercel.app',
  'https://animated-jelly-6d2f4d.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, faculty } = req.body;

    if (!name || !email || !password || !role || !faculty) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (name, email, password, role, faculty)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, faculty, created_at;
    `;
    const result = await pool.query(query, [name, email, hashedPassword, role, faculty]);

    res.status(201).json({ 
      message: 'User registered successfully', 
      user: result.rows[0] 
    });
  } catch (err) {
    console.error('❌ Registration failed:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        faculty: user.faculty,
      }
    });
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Report Routes
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

// Classes Route
app.get('/api/courses/classes', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT class_name FROM reports ORDER BY class_name');
    res.json(result.rows.length > 0 ? result.rows : []);
  } catch (err) {
    console.error('❌ Error fetching classes:', err.message);
    res.json([]);
  }
});

// Complaints Routes
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

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});