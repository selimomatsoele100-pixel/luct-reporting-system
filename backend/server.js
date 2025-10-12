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
    console.log(`📊 Database: ${process.env.DB_NAME || 'Render Cloud DB'}`);
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
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app')) {
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
// 🧩 MOCK DATA
// ======================================================
const mockUsers = [
  { id: 1, name: 'Test Student', email: 'student@luct.ac.ls', role: 'student', faculty: 'FICT', program: 'Information Technology', class_id: 1 },
  { id: 2, name: 'Test Lecturer', email: 'lecturer@luct.ac.ls', role: 'lecturer', faculty: 'FICT', program: 'Information Technology' },
  { id: 3, name: 'PRL FICT', email: 'prl@fict.luct.ac.ls', role: 'prl', faculty: 'FICT', program: 'Information Technology' },
  { id: 4, name: 'PL Admin', email: 'pl@luct.ac.ls', role: 'pl', faculty: 'FICT', program: 'Information Technology' },
  { id: 5, name: 'FMG Director', email: 'fmg@luct.ac.ls', role: 'fmg', faculty: 'FICT', program: 'Information Technology' }
];

const mockCourses = [
  { id: 1, course_code: 'DIWA2110', course_name: 'Web Application Development', faculty: 'FICT', program: 'IT', assigned_lecturer_id: 2 },
  { id: 2, course_code: 'DIPR2110', course_name: 'Programming Fundamentals', faculty: 'FICT', program: 'IT' },
  { id: 3, course_code: 'DIDS2110', course_name: 'Database Systems', faculty: 'FICT', program: 'IT' }
];

const mockReports = [
  {
    id: 1,
    class_name: 'IT Year 1',
    course_name: 'Web Application Development',
    course_code: 'DIWA2110',
    lecturer_name: 'John Doe',
    date_of_lecture: '2025-10-12',
    students_present: 48,
    total_students: 50,
    topic_taught: 'Intro to React',
    status: 'approved'
  }
];

// ======================================================
// 🌐 ROUTES
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

// LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const user = mockUsers.find(u => u.email === email) || mockUsers[0];
  const token = 'mock-token-' + Date.now();
  res.json({ message: 'Login successful', token, user });
});

// REPORTS (ensure arrays)
app.get('/api/reports/all', (req, res) => {
  res.json(Array.isArray(mockReports) ? mockReports : []);
});

app.get('/api/reports/my-reports', (req, res) => {
  res.json(Array.isArray(mockReports) ? mockReports.filter(r => r.lecturer_name === 'John Doe') : []);
});

// COURSES
app.get('/api/courses', (req, res) => {
  res.json(Array.isArray(mockCourses) ? mockCourses : []);
});

// MONITORING
app.get('/api/monitoring', (req, res) => {
  res.json({ total_reports: 12, pending_reports: 3, approved_reports: 9, average_attendance: 82, complaints: 4 });
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// FRONTEND (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')));
}

// ======================================================
// 🚀 START SERVER
// ======================================================
app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('🚀 Backend Live on Render');
  console.log(`🌐 URL: https://luct-reporting-system-1-9jwp.onrender.com`);
  console.log('='.repeat(70));
});
