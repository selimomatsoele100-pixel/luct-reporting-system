require('dotenv').config();
console.log("🧾 Loaded ENV:", process.env.DATABASE_URL ? "DATABASE_URL found ✅" : "DATABASE_URL missing ❌");

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// ======================================================
// 🧠 DATABASE CONFIGURATION
// ======================================================
let pool;
if (process.env.DATABASE_URL) {
  console.log("🌐 Using DATABASE_URL for connection");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  console.log("💻 Using local PostgreSQL configuration");
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'luct_system',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,
  });
}

pool.connect()
  .then(client => {
    console.log('✅ Connected to PostgreSQL database successfully');
    client.release();
  })
  .catch(err => console.error('❌ DB connection failed:', err.message));

pool.on('error', (err) => console.error('⚠️ Unexpected DB error:', err));

// ======================================================
// 🧱 MIDDLEWARE
// ======================================================
const allowedOrigins = [
  'http://localhost:3000',
  'https://luct-reporting-system.vercel.app',
  'https://luct-reporting-system-lac.vercel.app',
  'https://animated-jelly-6d2f4d.netlify.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.netlify.app')
    ) callback(null, true);
    else {
      console.warn(`🚫 Blocked CORS from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// ======================================================
// 🌐 HEALTH CHECK
// ======================================================
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'OK', database: 'Connected', time: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// ======================================================
// 🔐 AUTH ROUTES
// ======================================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, faculty } = req.body;

    if (!name || !email || !password || !role || !faculty) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery = `
      INSERT INTO users (name, email, password, role, faculty)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, faculty;
    `;
    const result = await pool.query(insertQuery, [name, email, hashedPassword, role, faculty]);

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        faculty: user.faculty,
      },
    });
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ======================================================
// 📋 REPORTS ROUTES
// ======================================================
app.post('/api/reports', async (req, res) => {
  try {
    const {
      faculty, class_name, week_of_reporting, date_of_lecture,
      course_name, course_code, students_present, total_students,
      venue, scheduled_time, topic_taught, learning_outcomes,
      recommendations, lecturer_name, status
    } = req.body;

    if (!course_code || !course_name || !class_name)
      return res.status(400).json({ error: 'Missing required fields' });

    const insertQuery = `
      INSERT INTO reports (
        faculty, class_name, week_of_reporting, date_of_lecture,
        course_name, course_code, students_present, total_students,
        venue, scheduled_time, topic_taught, learning_outcomes,
        recommendations, lecturer_name, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
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

app.get('/api/reports/all', async (_, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching reports:', err.message);
    res.json([]);
  }
});

// ======================================================
// 🗣️ COMPLAINTS ROUTES
// ======================================================
app.get('/api/complaints', async (_, res) => {
  try {
    const result = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(Array.isArray(result.rows) ? result.rows : []);
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

app.patch('/api/complaints/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { response_text } = req.body;
    const result = await pool.query(
      `UPDATE complaints SET response_text = $1, status = 'reviewed' WHERE id = $2 RETURNING *`,
      [response_text, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error responding to complaint:', err.message);
    res.status(500).json({ error: 'Failed to respond' });
  }
});

// ======================================================
// 📊 MONITORING ROUTES
// ======================================================
app.get('/api/monitoring/data', async (_, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports ORDER BY id DESC');
    res.json(Array.isArray(result.rows) ? result.rows : []);
  } catch (err) {
    console.error('❌ Error fetching monitoring data:', err.message);
    res.json([]);
  }
});

app.get('/api/monitoring', async (_, res) => {
  try {
    const reports = await pool.query('SELECT * FROM reports');
    const complaints = await pool.query('SELECT * FROM complaints');
    const ratings = await pool.query('SELECT * FROM rating');

    const total_reports = reports.rowCount || 0;
    const pending_reports = reports.rows.filter(r => r.status === 'pending').length;
    const approved_reports = reports.rows.filter(r => r.status === 'approved').length;
    const complaints_count = complaints.rowCount || 0;

    const avg_rating = ratings.rowCount
      ? Math.round(ratings.rows.reduce((sum, r) => sum + (r.score || 0), 0) / ratings.rowCount)
      : 0;

    res.json({
      total_reports,
      pending_reports,
      approved_reports,
      complaints: complaints_count,
      average_rating: avg_rating,
    });
  } catch (err) {
    console.error('❌ Monitoring fetch failed:', err.message);
    res.json({
      total_reports: 0,
      pending_reports: 0,
      approved_reports: 0,
      complaints: 0,
      average_rating: 0,
    });
  }
});

// ======================================================
// 🧩 SERVE FRONTEND (Production)
// ======================================================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (_, res) =>
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'))
  );
}

// ======================================================
// 🚀 START SERVER
// ======================================================
app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('🚀 LUCT REPORTING SYSTEM BACKEND - DEPLOYED ON RENDER');
  console.log(`🌐 Live URL: https://luct-reporting-system-1-9jwp.onrender.com`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'Render Cloud DB'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔌 Listening on PORT: ${PORT}`);
  console.log('='.repeat(70));
});
