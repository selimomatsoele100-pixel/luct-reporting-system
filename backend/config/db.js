const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection successful!');
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