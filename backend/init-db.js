const pool = require('./config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initDatabase = async () => {
  try {
    console.log('🔄 Starting database initialization...');

    // Drop tables if they exist (clean setup)
    console.log('Cleaning existing tables...');
    await pool.query('DROP TABLE IF EXISTS class_assignments CASCADE');
    await pool.query('DROP TABLE IF EXISTS complaints CASCADE');
    await pool.query('DROP TABLE IF EXISTS reports CASCADE');
    await pool.query('DROP TABLE IF EXISTS courses CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    await pool.query('DROP TABLE IF EXISTS classes CASCADE');

    // Create tables in correct order
    console.log('Creating classes table...');
    await pool.query(`
      CREATE TABLE classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        faculty VARCHAR(100) NOT NULL,
        program_leader_id INTEGER
      )
    `);

    console.log('Creating users table...');
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'lecturer', 'prl', 'pl', 'fmg')),
        faculty VARCHAR(100) NOT NULL CHECK (faculty IN ('FICT', 'FBMG', 'FABE')),
        class_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating courses table...');
    await pool.query(`
      CREATE TABLE courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        faculty VARCHAR(100) NOT NULL,
        assigned_lecturer_id INTEGER
      )
    `);

    console.log('Creating reports table...');
    await pool.query(`
      CREATE TABLE reports (
        id SERIAL PRIMARY KEY,
        faculty_name VARCHAR(100) NOT NULL,
        class_name VARCHAR(255) NOT NULL,
        week_of_reporting VARCHAR(50) NOT NULL,
        date_of_lecture DATE NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        course_code VARCHAR(50) NOT NULL,
        lecturer_name VARCHAR(255) NOT NULL,
        actual_students_present INTEGER NOT NULL,
        total_registered_students INTEGER NOT NULL,
        venue VARCHAR(255) NOT NULL,
        scheduled_time TIME NOT NULL,
        topic_taught TEXT NOT NULL,
        learning_outcomes TEXT NOT NULL,
        recommendations TEXT NOT NULL,
        lecturer_id INTEGER NOT NULL,
        student_signed BOOLEAN DEFAULT FALSE,
        student_signed_at TIMESTAMP,
        prl_reviewed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating complaints table...');
    await pool.query(`
      CREATE TABLE complaints (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        complainant_id INTEGER NOT NULL,
        target_user_id INTEGER NOT NULL,
        complaint_type VARCHAR(50) NOT NULL CHECK (complaint_type IN ('lecturer', 'prl', 'pl', 'fmg')),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
        response TEXT,
        responded_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating class_assignments table...');
    await pool.query(`
      CREATE TABLE class_assignments (
        id SERIAL PRIMARY KEY,
        lecturer_id INTEGER NOT NULL,
        class_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        assigned_by INTEGER NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add foreign key constraints
    console.log('Adding foreign key constraints...');
    await pool.query(`
      ALTER TABLE users 
      ADD CONSTRAINT fk_users_class 
      FOREIGN KEY (class_id) REFERENCES classes(id)
    `);

    await pool.query(`
      ALTER TABLE courses 
      ADD CONSTRAINT fk_courses_lecturer 
      FOREIGN KEY (assigned_lecturer_id) REFERENCES users(id)
    `);

    await pool.query(`
      ALTER TABLE reports 
      ADD CONSTRAINT fk_reports_lecturer 
      FOREIGN KEY (lecturer_id) REFERENCES users(id)
    `);

    await pool.query(`
      ALTER TABLE complaints 
      ADD CONSTRAINT fk_complaints_complainant 
      FOREIGN KEY (complainant_id) REFERENCES users(id),
      ADD CONSTRAINT fk_complaints_target 
      FOREIGN KEY (target_user_id) REFERENCES users(id)
    `);

    await pool.query(`
      ALTER TABLE class_assignments 
      ADD CONSTRAINT fk_assignments_lecturer 
      FOREIGN KEY (lecturer_id) REFERENCES users(id),
      ADD CONSTRAINT fk_assignments_class 
      FOREIGN KEY (class_id) REFERENCES classes(id),
      ADD CONSTRAINT fk_assignments_course 
      FOREIGN KEY (course_id) REFERENCES courses(id),
      ADD CONSTRAINT fk_assignments_assigned_by 
      FOREIGN KEY (assigned_by) REFERENCES users(id)
    `);

    await pool.query(`
      ALTER TABLE classes 
      ADD CONSTRAINT fk_classes_program_leader 
      FOREIGN KEY (program_leader_id) REFERENCES users(id)
    `);

    // Insert sample data
    console.log('Inserting sample data...');
    
    // Insert classes
    await pool.query(`
      INSERT INTO classes (name, faculty) VALUES 
      ('BIT-1A', 'FICT'),
      ('BIT-1B', 'FICT'),
      ('DIT-1A', 'FICT'),
      ('BBA-1A', 'FBMG'),
      ('BBA-1B', 'FBMG'),
      ('ENG-1A', 'FABE')
    `);

    // Insert courses
    await pool.query(`
      INSERT INTO courses (name, code, faculty) VALUES 
      ('Web Development', 'WD101', 'FICT'),
      ('Database Systems', 'DB201', 'FICT'),
      ('Business Management', 'BM101', 'FBMG'),
      ('Engineering Math', 'EM101', 'FABE')
    `);

    // Create admin user
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await pool.query(`
      INSERT INTO users (email, password, name, role, faculty, class_id) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `, ['admin@luct.ac.ls', hashedPassword, 'System Administrator', 'pl', 'FICT', 1]);

    // Update classes with program leader
    await pool.query(`
      UPDATE classes SET program_leader_id = 1 WHERE id = 1
    `);

    console.log('🎉 Database initialization completed successfully!');
    console.log('✅ All tables created and populated');
    console.log('👤 Admin user: admin@luct.ac.ls');
    console.log('🔑 Admin password: admin123');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    process.exit();
  }
};

initDatabase();