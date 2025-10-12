require('dotenv').config();
console.log("🧾 Loaded ENV:", process.env.DATABASE_URL ? "DATABASE_URL found ✅" : "DATABASE_URL missing ❌");

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
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
// 🌐 ROUTES
// ======================================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'OK', database: 'Connected', time: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// ✅ Create new report
app.post('/api/reports', async (req, res) => {
  try {
    const {
      faculty,
      class_name,
      week_of_reporting,
      date_of_lecture,
      course_name,
      course_code,
      students_present,
      total_students,
      venue,
      scheduled_time,
      topic_taught,
      learning_outcomes,
      recommendations,
      lecturer_name,
      status
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
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *;
    `;

    const values = [
      faculty,
      class_name,
      week_of_reporting,
      date_of_lecture,
      course_name,
      course_code,
      students_present,
      total_students,
      venue,
      scheduled_time,
      topic_taught,
      learning_outcomes,
      recommendations,
      lecturer_name,
      status || 'pending'
    ];

    const result = await pool.query(insertQuery, values);

    console.log('📝 New Report Created:', result.rows[0]);
    res.status(201).json({ message: 'Report created successfully', report: result.rows[0] });
  } catch (err) {
    console.error('❌ Error inserting report:', err.message);
    res.status(500).json({ error: 'Failed to insert report' });
  }
});

// ✅ Fetch all reports
app.get('/api/reports/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching reports:', err.message);
    res.json([]);
  }
});

// ✅ Fetch lecturer-specific reports
app.get('/api/reports/my-reports', async (req, res) => {
  try {
    const lecturer = req.query.lecturer || 'John Doe';
    const result = await pool.query(
      'SELECT * FROM reports WHERE lecturer_name = $1 ORDER BY id DESC',
      [lecturer]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching my reports:', err.message);
    res.json([]);
  }
});

// ✅ Submit complaint
app.post('/api/complaints', async (req, res) => {
  try {
    const { user_id, complaint_text, category } = req.body;

    if (!complaint_text) {
      return res.status(400).json({ error: 'Complaint text is required' });
    }

    const result = await pool.query(
      `INSERT INTO complaints (user_id, complaint_text, category, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [user_id || null, complaint_text, category || 'general']
    );

    res.status(201).json({ message: 'Complaint submitted', complaint: result.rows[0] });
  } catch (err) {
    console.error('❌ Error inserting complaint:', err.message);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// ✅ Submit rating
app.post('/api/rating', async (req, res) => {
  try {
    const { report_id, lecturer_id, score, feedback } = req.body;

    if (!report_id || !score) {
      return res.status(400).json({ error: 'Missing required rating data' });
    }

    const result = await pool.query(
      `INSERT INTO rating (report_id, lecturer_id, score, feedback, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [report_id, lecturer_id || null, score, feedback || '']
    );

    res.status(201).json({ message: 'Rating submitted', rating: result.rows[0] });
  } catch (err) {
    console.error('❌ Error inserting rating:', err.message);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// ✅ Monitoring stats
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
// 🧩 SERVE FRONTEND (production)
// ======================================================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'))
  );
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
