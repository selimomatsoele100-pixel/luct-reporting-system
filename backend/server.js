require('dotenv').config();
console.log("🧾 Loaded ENV:", process.env.DATABASE_URL ? "DATABASE_URL found ✅" : "DATABASE_URL missing ❌");

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT; // ✅ Render dynamically assigns this

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
    console.log(`📊 Database: ${process.env.DB_NAME || 'Render Cloud DB'}`);
    client.release();
  })
  .catch(err => console.error('❌ DB connection failed:', err.message));

pool.on('error', (err) => console.error('⚠️ Unexpected DB error:', err));

// ======================================================
// 🧱 MIDDLEWARE (CORS + JSON)
// ======================================================
const allowedOrigins = [
  'http://localhost:3000',
  'https://luct-reporting-system.vercel.app',
  'https://luct-reporting-system-lac.vercel.app',
  'https://animated-jelly-6d2f4d.netlify.app'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow Postman, curl, etc.
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.netlify.app')
      ) {
        callback(null, true);
      } else {
        console.warn(`🚫 Blocked CORS from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// ======================================================
// 🌐 BASIC ROUTES
// ======================================================
app.get('/', (req, res) => {
  res.json({
    message: '🚀 LUCT Reporting System Backend is RUNNING!',
    status: 'ACTIVE',
    environment: process.env.NODE_ENV || 'production',
    backend: 'Render',
    api_base: `https://luct-reporting-system-1-9jwp.onrender.com`
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'OK', database: 'Connected', time: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// ======================================================
// 🧾 AUTH
// ======================================================
const mockUsers = [
  { id: 1, name: 'Test Student', email: 'student@luct.ac.ls', role: 'student', faculty: 'FICT', program: 'Information Technology', class_id: 1 },
  { id: 2, name: 'Test Lecturer', email: 'lecturer@luct.ac.ls', role: 'lecturer', faculty: 'FICT', program: 'Information Technology' },
  { id: 3, name: 'PRL FICT', email: 'prl@fict.luct.ac.ls', role: 'prl', faculty: 'FICT', program: 'Information Technology' },
  { id: 4, name: 'PL Admin', email: 'pl@luct.ac.ls', role: 'pl', faculty: 'FICT', program: 'Information Technology' },
  { id: 5, name: 'FMG Director', email: 'fmg@luct.ac.ls', role: 'fmg', faculty: 'FICT', program: 'Information Technology' }
];

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const user = mockUsers.find(u => u.email === email) || mockUsers[0];
  const token = 'mock-token-' + Date.now();
  res.json({ message: 'Login successful', token, user });
});

// ======================================================
// 📊 REPORTS
// ======================================================
app.get('/api/reports/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching reports:', err.message);
    res.json([]);
  }
});

app.get('/api/reports/my-reports', async (req, res) => {
  try {
    const lecturer = 'John Doe';
    const result = await pool.query('SELECT * FROM reports WHERE lecturer_name = $1 ORDER BY id DESC', [lecturer]);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching my reports:', err.message);
    res.json([]);
  }
});

// ✏️ Create a new report
app.post('/api/reports', async (req, res) => {
  try {
    const {
      class_name,
      course_name,
      course_code,
      lecturer_name,
      date_of_lecture,
      students_present,
      total_students,
      topic_taught,
      learning_outcomes,
      recommendations
    } = req.body;

    const query = `
      INSERT INTO reports 
      (class_name, course_name, course_code, lecturer_name, date_of_lecture, 
       students_present, total_students, topic_taught, learning_outcomes, recommendations, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')
      RETURNING *;
    `;
    const values = [
      class_name, course_name, course_code, lecturer_name,
      date_of_lecture, students_present, total_students,
      topic_taught, learning_outcomes, recommendations
    ];

    const result = await pool.query(query, values);
    res.status(201).json({ message: '✅ Report created successfully!', report: result.rows[0] });
  } catch (error) {
    console.error('❌ Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// ======================================================
// 💬 COMPLAINTS
// ======================================================
app.get('/api/complaints', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching complaints:', err.message);
    res.json([]);
  }
});

// Create new complaint
app.post('/api/complaints', async (req, res) => {
  try {
    const { user_id, description } = req.body;
    const result = await pool.query(
      `INSERT INTO complaints (user_id, description, created_at) VALUES ($1, $2, NOW()) RETURNING *`,
      [user_id, description]
    );
    res.status(201).json({ message: '✅ Complaint submitted', complaint: result.rows[0] });
  } catch (err) {
    console.error('❌ Error creating complaint:', err.message);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// ======================================================
// ⭐ RATING
// ======================================================
app.post('/api/rating', async (req, res) => {
  try {
    const { report_id, lecturer_id, score, feedback } = req.body;
    const result = await pool.query(
      `INSERT INTO rating (report_id, lecturer_id, score, feedback, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [report_id, lecturer_id, score, feedback]
    );
    res.status(201).json({ message: '✅ Rating submitted successfully!', rating: result.rows[0] });
  } catch (err) {
    console.error('❌ Error creating rating:', err.message);
    res.status(500).json({ error: 'Failed to create rating' });
  }
});

// ======================================================
// 📈 MONITORING
// ======================================================
app.get('/api/monitoring', async (req, res) => {
  try {
    const reports = await pool.query('SELECT * FROM reports');
    const complaints = await pool.query('SELECT * FROM complaints');
    const ratings = await pool.query('SELECT * FROM rating');

    const total_reports = reports.rowCount || 0;
    const pending_reports = reports.rows.filter(r => r.status === 'pending').length;
    const approved_reports = reports.rows.filter(r => r.status === 'approved').length;
    const complaints_count = complaints.rowCount || 0;

    let avg_rating = 0;
    if (ratings.rowCount > 0) {
      const total_score = ratings.rows.reduce((sum, r) => sum + (r.score || 0), 0);
      avg_rating = Math.round(total_score / ratings.rowCount);
    }

    res.json({
      total_reports,
      pending_reports,
      approved_reports,
      complaints: complaints_count,
      average_rating: avg_rating
    });
  } catch (err) {
    console.error('❌ Monitoring fetch failed:', err.message);
    res.json({
      total_reports: 0,
      pending_reports: 0,
      approved_reports: 0,
      complaints: 0,
      average_rating: 0
    });
  }
});

// ======================================================
// ⚙️ ERROR HANDLER
// ======================================================
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ======================================================
// 🧩 FRONTEND SERVE (Render Production)
// ======================================================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));
}

// ======================================================
// 🚀 START SERVER
// ======================================================
app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('🚀 LUCT REPORTING SYSTEM BACKEND - DEPLOYED ON RENDER');
  console.log('='.repeat(70));
  console.log(`🌐 Live URL: https://luct-reporting-system-1-9jwp.onrender.com`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'Render Cloud DB'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔌 Listening on PORT: ${PORT}`);
  console.log('='.repeat(70));
});
