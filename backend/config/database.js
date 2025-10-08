const { Pool } = require('pg');
require('dotenv').config();

// Validate environment variables
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.log('💡 Please check your .env file');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection
  maxUses: 7500, // Close a client after it has been used this many times
});

// Test connection on startup
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully');
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    client.release();
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL database:');
    console.error('   Error:', error.message);
    console.error('   Please check:');
    console.error('   - Database server is running');
    console.error('   - Database credentials in .env file');
    console.error('   - Database exists: ' + process.env.DB_NAME);
    process.exit(1);
  }
};

testConnection();

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err);
  // Don't exit process here, let the app handle it
});

module.exports = pool;