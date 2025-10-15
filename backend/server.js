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
// 🧱 FIXED CORS CONFIGURATION
// ======================================================
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://luct-reporting-system.vercel.app',
    'https://luct-reporting-system-lac.vercel.app', 
    'https://luct-reporting-system-1bad.vercel.app',
    'https://animated-jelly-6d2f4d.netlify.app',
    'https://luct-reporting-frontend.vercel.app', // Add your actual Vercel domain
    /.vercel\.app$/, // Allow all Vercel subdomains
    /.netlify\.app$/ // Allow all Netlify subdomains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

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

// Auth Routes - FIXED VERSION
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, faculty } = req.body;

    console.log('📝 Registration attempt:', { name, email, role, faculty });

    if (!name || !email || !password || !role || !faculty) {
      return res.status(400).json({ 
        error: 'All fields are required',
        missing: {
          name: !name,
          email: !email, 
          password: !password,
          role: !role,
          faculty: !faculty
        }
      });
    }

    // Check if user exists
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Email already registered',
        email: email
      });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (name, email, password, role, faculty)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, faculty, created_at;
    `;
    
    const result = await pool.query(query, [name, email, hashedPassword, role, faculty]);
    
    console.log('✅ User registered successfully:', result.rows[0].email);

    res.status(201).json({ 
      message: 'User registered successfully', 
      user: result.rows[0],
      token: 'temp-token-' + Date.now()
    });

  } catch (err) {
    console.error('❌ Registration failed:', err.message);
    res.status(500).json({ 
      error: 'Registration failed',
      details: err.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password required',
        missing: {
          email: !email,
          password: !password
        }
      });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        email: email
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        email: email
      });
    }

    console.log('✅ Login successful:', user.email);

    res.json({
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
      error: 'Login failed',
      details: err.message
    });
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
  console.log(`✅ CORS configured for frontend domains`);
});