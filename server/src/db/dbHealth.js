const { pool } = require('./index');

/**
 * Pings the PostgreSQL database and measures round-trip query latency
 * @returns {Promise<{ status: string, latencyMs: number, timestamp: string, poolStats: object }>}
 */
async function checkDatabaseHealth() {
  const startTime = process.hrtime();
  try {
    const result = await pool.query('SELECT 1 AS heartbeat, NOW() as server_time');
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const latencyMs = Number((seconds * 1000 + nanoseconds / 1e6).toFixed(2));

    return {
      status: 'healthy',
      latencyMs,
      timestamp: new Date().toISOString(),
      databaseTime: result.rows[0]?.server_time,
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
    };
  } catch (error) {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    return {
      status: 'degraded',
      latencyMs: Number((seconds * 1000 + nanoseconds / 1e6).toFixed(2)),
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Retrieves table storage diagnostics and row count estimates from PostgreSQL catalog
 */
async function getTableDiagnostics() {
  const diagnosticQuery = `
    SELECT
      relname AS table_name,
      n_live_tup AS estimated_rows,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC;
  `;

  try {
    const res = await pool.query(diagnosticQuery);
    return res.rows;
  } catch (err) {
    console.error('[DB Health] Failed to fetch table diagnostics:', err.message);
    return [];
  }
}

module.exports = {
  checkDatabaseHealth,
  getTableDiagnostics,
};
