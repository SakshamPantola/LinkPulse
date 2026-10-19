/**
 * Database Verification & Maintenance Utility
 * Authored by Sarthak Bhatt (@SarthakBhatt55)
 */

const { pool } = require('./index');

/**
 * Checks for orphaned click events or inconsistencies in foreign key relations
 */
async function auditDatabaseIntegrity() {
  const auditReport = {
    orphanedClicks: 0,
    linksWithoutUsers: 0,
    expiredLinksCount: 0,
    auditTimestamp: new Date().toISOString(),
  };

  try {
    // 1. Check for clicks referring to deleted links
    const orphanedClicksRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM click_events ce
      LEFT JOIN links l ON ce.link_id = l.id
      WHERE l.id IS NULL;
    `);
    auditReport.orphanedClicks = parseInt(orphanedClicksRes.rows[0].count, 10);

    // 2. Check for links with missing user parent
    const orphanedLinksRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM links l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE u.id IS NULL;
    `);
    auditReport.linksWithoutUsers = parseInt(orphanedLinksRes.rows[0].count, 10);

    // 3. Count expired links that are still marked as active
    const expiredRes = await pool.query(`
      SELECT COUNT(*) as count
      FROM links
      WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_active = true;
    `);
    auditReport.expiredLinksCount = parseInt(expiredRes.rows[0].count, 10);

    return auditReport;
  } catch (err) {
    console.error('[DB Audit] Integrity check error:', err.message);
    throw err;
  }
}

/**
 * Automatically soft-deactivates links that passed their expiration timestamp
 */
async function sweepExpiredLinks() {
  try {
    const sweepRes = await pool.query(`
      UPDATE links
      SET is_active = false
      WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_active = true
      RETURNING id, short_code;
    `);
    return {
      deactivatedCount: sweepRes.rowCount,
      deactivatedLinks: sweepRes.rows,
    };
  } catch (err) {
    console.error('[DB Sweep] Failed to sweep expired links:', err.message);
    throw err;
  }
}

module.exports = {
  auditDatabaseIntegrity,
  sweepExpiredLinks,
};
