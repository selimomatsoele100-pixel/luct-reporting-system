const { Pool } = require('pg');
require('dotenv').config();

// ✅ Validate for either DATABASE_URL or individual DB vars
if (!process.env.DATABASE_URL) {
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.log('💡 Please check your .env file');
    process.exit(1);
  }
}

let pool;

// 🌍 Prefer DATABASE_URL (for production)
if (process.env.DATABASE_URL) {
  console.log('🌐 Using cloud database via DATABASE_URL');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  console.log('💻 Using local PostgreSQL connection');
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

// 🧪 Test the connection immediately
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection successful!');
    console.log(`📊 Database: ${process.env.DB_NAME || '(via DATABASE_URL)'}`);
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed!');
    console.error(err.message);
    process.exit(1);
  }
})();

pool.on('error', (err) => {
  console.error('⚠️ Unexpected error on idle PostgreSQL client:', err);
});

module.exports = pool;
