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

// Test DB connection
pool.connect()
  .then(client => {
    console.log('✅ Connected to PostgreSQL database successfully');
    console.log(`📊 Database: ${process.env.DB_NAME || 'Render Cloud DB'}`);
    client.release();
  })
  .catch(err => {
    console.error('❌ Failed to connect to PostgreSQL database:', err.message);
  });

pool.on('error', (err) => {
  console.error('⚠️ Unexpected database error:', err);
});

// ======================================================
// 🧱 MIDDLEWARE (CORS + JSON)
// ======================================================
const allowedOrigins = [
  'http://localhost:3000',
  'https://animated-jelly-6d2f4d.netlify.app',
  'https://luct-reporting-system.vercel.app',
  'https://luct-reporting-system-lac.vercel.app'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      // ✅ Allow Vercel, Netlify, and local
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app')) {
        callback(null, true);
      } else {
        console.warn(`🚫 Blocked CORS request from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// ======================================================
// 🧩 MOCK DATA (temporary demo data)
// ======================================================
const mockUsers = [
  { id: 1, name: 'Test Student', email: 'student@luct.ac.ls', role: 'student', faculty: 'FICT', program: 'Information Technology', class_id: 1 },
  { id: 2, name: 'Test Lecturer', email: 'lecturer@luct.ac.ls', role: 'lecturer', faculty: 'FICT', program: 'Information Technology' },
  { id: 3, name: 'PRL FICT', email: 'prl@fict.luct.ac.ls', role: 'prl', faculty: 'FICT', program: 'Information Technology' },
  { id: 4, name: 'PL Admin', email: 'pl@luct.ac.ls', role: 'pl', faculty: 'FICT', program: 'Information Technology' },
  { id: 5, name: 'FMG Director', email: 'fmg@luct.ac.ls', role: 'fmg', faculty: 'FICT', program: 'Information Technology' }
];

const mockClasses = [
  { id: 1, class_name: 'IT Year 1', faculty: 'FICT', program: 'Information Technology', total_students: 50, assigned_lecturer_id: 2 },
  { id: 2, class_name: 'IT Year 2', faculty: 'FICT', program: 'Information Technology', total_students: 45 },
  { id: 3, class_name: 'BIT Year 1', faculty: 'FICT', program: 'Business IT', total_students: 40 }
];

const mockCourses = [
  { id: 1, course_code: 'DIWA2110', course_name: 'Web Application Development', faculty: 'FICT', program: 'Information Technology', assigned_lecturer_id: 2 },
  { id: 2, course_code: 'DIPR2110', course_name: 'Programming Fundamentals', faculty: 'FICT', program: 'Information Technology' },
  { id: 3, course_code: 'DIDS2110', course_name: 'Database Systems', faculty: 'FICT', program: 'Information Technology' }
];

// ======================================================
// 🌐 BASIC ROUTES
// ======================================================
app.get('/', (req, res) => {
  res.json({
    message: '🚀 LUCT Reporting System Backend is RUNNING!',
    timestamp: new Date().toISOString(),
    status: 'ACTIVE',
    port: PORT,
    database: process.env.DB_NAME || 'Render Cloud DB',
    frontend_url: 'https://luct-reporting-system.vercel.app',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
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

// ======================================================
// 🧾 AUTH ROUTES
// ======================================================
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const user = mockUsers.find(u => u.email === email) || mockUsers[0];
  const token = 'mock-token-' + Date.now();
  res.json({ message: 'Login successful', token, user });
});

// ======================================================
// 📊 REPORTS ROUTES (mock)
// ======================================================
app.get('/api/reports/all', (req, res) => {
  res.json([
    { id: 1, course: 'Web Dev', week: 'Week 6', lecturer: 'John Doe' }
  ]);
});

// ======================================================
// 📈 MONITORING ROUTES
// ======================================================
app.get('/api/monitoring', (req, res) => {
  res.json({
    total_reports: 12,
    pending_reports: 3,
    approved_reports: 9,
    average_attendance: 82,
    complaints: 4,
  });
});

// ======================================================
// ⚙️ ERROR HANDLING
// ======================================================
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ======================================================
// 🧩 SERVE FRONTEND (for Render combined build)
// ======================================================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// ======================================================
// 🚀 START SERVER
// ======================================================
app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('🚀 LUCT REPORTING SYSTEM BACKEND - LIVE');
  console.log('='.repeat(70));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'Render Cloud DB'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log('='.repeat(70));
  console.log('💡 Health check: https://luct-reporting-system-1-9jwp.onrender.com/api/health');
  console.log('='.repeat(70));
});
