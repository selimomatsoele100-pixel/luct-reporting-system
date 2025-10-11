// backend/init-db.js
require('dotenv').config();
const { Pool } = require('pg');

// ✅ Create a pool using DATABASE_URL (works locally & on Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const initDatabase = async () => {
  try {
    console.log("🚀 Starting database initialization...");

    // Drop tables in safe dependency order
    await pool.query(`
      DROP TABLE IF EXISTS class_assignments CASCADE;
      DROP TABLE IF EXISTS complaints CASCADE;
      DROP TABLE IF EXISTS reports CASCADE;
      DROP TABLE IF EXISTS courses CASCADE;
      DROP TABLE IF EXISTS classes CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log("🧱 Creating tables...");

    // Create users table first
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'lecturer', 'prl', 'pl', 'fmg')),
        faculty VARCHAR(50) CHECK (faculty IN ('FICT', 'FBMG', 'FABE')),
        class_id INTEGER,
        program VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create classes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        class_name VARCHAR(100) NOT NULL,
        faculty VARCHAR(50) NOT NULL CHECK (faculty IN ('FICT', 'FBMG', 'FABE')),
        total_students INTEGER DEFAULT 0,
        program VARCHAR(100),
        assigned_lecturer_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        course_code VARCHAR(20) UNIQUE NOT NULL,
        course_name VARCHAR(100) NOT NULL,
        faculty VARCHAR(50) NOT NULL CHECK (faculty IN ('FICT', 'FBMG', 'FABE')),
        program VARCHAR(100),
        assigned_lecturer_id INTEGER REFERENCES users(id),
        assigned_prl_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        faculty VARCHAR(50) NOT NULL,
        class_id INTEGER REFERENCES classes(id),
        class_name VARCHAR(100) NOT NULL,
        week_of_reporting VARCHAR(20) NOT NULL,
        date_of_lecture DATE NOT NULL,
        course_name VARCHAR(100) NOT NULL,
        course_code VARCHAR(20) NOT NULL,
        lecturer_id INTEGER REFERENCES users(id) NOT NULL,
        lecturer_name VARCHAR(100) NOT NULL,
        students_present INTEGER NOT NULL,
        total_students INTEGER NOT NULL,
        venue VARCHAR(100) NOT NULL,
        scheduled_time TIME NOT NULL,
        topic_taught TEXT NOT NULL,
        learning_outcomes TEXT NOT NULL,
        recommendations TEXT,
        student_signature TEXT,
        student_approved BOOLEAN DEFAULT false,
        prl_feedback TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'student_approved', 'prl_approved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create complaints table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        complainant_id INTEGER REFERENCES users(id) NOT NULL,
        complainant_name VARCHAR(100) NOT NULL,
        complainant_role VARCHAR(50) NOT NULL,
        complaint_against_id INTEGER REFERENCES users(id) NOT NULL,
        complaint_against_name VARCHAR(100) NOT NULL,
        complaint_against_role VARCHAR(50) NOT NULL,
        complaint_text TEXT NOT NULL,
        faculty VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
        response_text TEXT,
        responded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create class assignments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS class_assignments (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id),
        lecturer_id INTEGER REFERENCES users(id),
        assigned_by INTEGER REFERENCES users(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Tables created successfully. Inserting seed data...");

    // Insert sample users (password: password123)
    await pool.query(`
      INSERT INTO users (name, email, password, role, faculty, program) VALUES
      ('Admin PL', 'pl@luct.ac.ls', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pl', 'FICT', 'IT'),
      ('PRL FICT', 'prl@fict.luct.ac.ls', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'prl', 'FICT', 'IT'),
      ('Lecturer John', 'lecturer@luct.ac.ls', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'lecturer', 'FICT', 'IT'),
      ('Student Rep', 'student@luct.ac.ls', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'FICT', 'IT'),
      ('FMG Director', 'fmg@luct.ac.ls', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'fmg', 'FICT', 'IT')
      ON CONFLICT (email) DO NOTHING;
    `);

    // Insert sample classes
    await pool.query(`
      INSERT INTO classes (class_name, faculty, total_students, program) VALUES
      ('IT Year 1', 'FICT', 50, 'Information Technology'),
      ('IT Year 2', 'FICT', 45, 'Information Technology'),
      ('BIT Year 1', 'FICT', 40, 'Business IT')
      ON CONFLICT DO NOTHING;
    `);

    // Insert sample courses
    await pool.query(`
      INSERT INTO courses (course_code, course_name, faculty, program) VALUES
      ('DIWA2110', 'Web Application Development', 'FICT', 'Information Technology'),
      ('DIPR2110', 'Programming Fundamentals', 'FICT', 'Information Technology'),
      ('DIDS2110', 'Database Systems', 'FICT', 'Information Technology')
      ON CONFLICT (course_code) DO NOTHING;
    `);

    console.log("🎉 Database initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  } finally {
    await pool.end();
    console.log("🔒 Connection closed.");
  }
};

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
