/**
 * PostgreSQL Database Connection Pool & Client Provider
 * Engineered by Sarthak Bhatt (@SarthakBhatt55)
 */

const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]: Unexpected client error on idle connection:', err.message);
});

/**
 * Executes a parameterized SQL query with execution timing telemetry
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && duration > 500) {
      console.warn(`[Slow Query Detected] ${duration}ms: ${text.substring(0, 100)}...`);
    }
    return res;
  } catch (error) {
    console.error(`[DB Query Error] Query failed (${Date.now() - start}ms):`, error.message);
    throw error;
  }
};

module.exports = { pool, query };
