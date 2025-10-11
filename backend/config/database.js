const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  console.log('🌐 Using DATABASE_URL for connection');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
} else {
    console.log('🖥️ Using LOCAL database connection');
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'luct_reporting',
      password: process.env.DB_PASSWORD || '123456',
      port: process.env.DB_PORT || 5432,
    });
}

(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully');
    console.log(`📊 Mode: ${process.env.DATABASE_URL ? 'ONLINE (Render / Cloud)' : 'LOCAL'}`);
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL database:');
    console.error('   →', err.message);
  }
})();

module.exports = { pool, query: (text, params) => pool.query(text, params) };
