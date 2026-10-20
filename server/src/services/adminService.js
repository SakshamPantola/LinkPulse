
const { query } = require('../db');
const { invalidateLink } = require('./linkService');
const cache = require('./cacheService');

async function getPlatformAnalytics() {
  
  const [userCountRes, linkStatsRes, clickStatsRes, blockedCountRes] = await Promise.all([
    query('SELECT COUNT(*)::int AS total FROM users'),
    query(`SELECT
             COUNT(*)::int AS total_links,
             COUNT(CASE WHEN status = 'active' AND (expires_at IS NULL OR expires_at > NOW()) THEN 1 END)::int AS active_links,
             COUNT(CASE WHEN status = 'disabled' THEN 1 END)::int AS disabled_links
           FROM links`),
    query(`SELECT
             COUNT(*)::int AS total_clicks,
             COUNT(DISTINCT visitor_hash)::int AS unique_visitors
           FROM click_events
           WHERE is_bot = false`),
    query('SELECT COUNT(*)::int AS total FROM blocked_domains'),
  ]);

  const timeSeriesRes = await query(
    `SELECT TO_CHAR(clicked_at, 'YYYY-MM-DD') AS date,
            COUNT(*)::int AS clicks
     FROM click_events
     WHERE is_bot = false AND clicked_at >= (NOW() - interval '30 days')
     GROUP BY TO_CHAR(clicked_at, 'YYYY-MM-DD')
     ORDER BY date ASC`
  );

  const topDomainsRes = await query(
    `SELECT
       LOWER(REGEXP_REPLACE(REGEXP_REPLACE(destination_url, '^https?://', ''), '/.*$', '')) AS domain,
       COUNT(*)::int AS link_count
     FROM links
     GROUP BY domain
     ORDER BY link_count DESC
     LIMIT 5`
  );

  return {
    totalUsers: userCountRes.rows[0].total,
    totalLinks: linkStatsRes.rows[0].total_links,
    activeLinks: linkStatsRes.rows[0].active_links,
    disabledLinks: linkStatsRes.rows[0].disabled_links,
    totalClicks: clickStatsRes.rows[0].total_clicks,
    uniqueVisitors: clickStatsRes.rows[0].unique_visitors,
    blockedDomainsCount: blockedCountRes.rows[0].total,
    clicksOverTime: timeSeriesRes.rows,
    topDomains: topDomainsRes.rows,
  };
}

async function getAllUsers({ page = 1, limit = 25, search = '' } = {}) {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(u.email ILIKE $${params.length} OR u.name ILIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*)::int AS total FROM users u ${where}`, params);
  const total = countRes.rows[0].total;

  const dataParams = [...params, limit, offset];
  const { rows } = await query(
    `SELECT u.id, u.email, u.name, u.role, u.created_at,
            COALESCE(l.link_count, 0)::int AS total_links,
            COALESCE(st.total_clicks, 0)::int AS total_clicks
     FROM users u
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS link_count FROM links GROUP BY user_id
     ) l ON l.user_id = u.id
     LEFT JOIN (
       SELECT l.user_id, COUNT(ce.id)::int AS total_clicks
       FROM click_events ce
       JOIN links l ON l.id = ce.link_id
       WHERE ce.is_bot = false
       GROUP BY l.user_id
     ) st ON st.user_id = u.id
     ${where}
     ORDER BY u.created_at DESC
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return {
    users: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function getAllLinks({ page = 1, limit = 25, search = '', status = '' } = {}) {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(l.short_code ILIKE $${params.length} OR l.destination_url ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }

  if (status) {
    params.push(status);
    conditions.push(`l.status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(
    `SELECT COUNT(*)::int AS total FROM links l JOIN users u ON u.id = l.user_id ${where}`,
    params
  );
  const total = countRes.rows[0].total;

  const dataParams = [...params, limit, offset];
  const { rows } = await query(
    `SELECT l.id, l.short_code, l.destination_url, l.status, l.click_limit,
            l.expires_at, l.created_at,
            u.email AS user_email, u.name AS user_name,
            c.name AS campaign_name,
            COALESCE(ce.click_count, 0)::int AS click_count
     FROM links l
     JOIN users u ON u.id = l.user_id
     LEFT JOIN campaigns c ON c.id = l.campaign_id
     LEFT JOIN (
       SELECT link_id, COUNT(*)::int AS click_count
       FROM click_events
       WHERE is_bot = false
       GROUP BY link_id
     ) ce ON ce.link_id = l.id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return {
    links: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function setLinkStatus(linkId, status) {
  if (!['active', 'disabled'].includes(status)) {
    const err = new Error('Invalid status. Must be "active" or "disabled"');
    err.status = 400;
    throw err;
  }

  const { rows } = await query(
    `UPDATE links SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, linkId]
  );

  if (!rows.length) {
    const err = new Error('Link not found');
    err.status = 404;
    throw err;
  }

  const link = rows[0];

  await invalidateLink(link.short_code);

  return link;
}

async function getBlockedDomains() {
  const { rows } = await query(
    'SELECT id, domain, created_at FROM blocked_domains ORDER BY created_at DESC'
  );
  return rows;
}

async function addBlockedDomain({ domain }) {
  if (!domain || !domain.trim()) {
    const err = new Error('Domain is required');
    err.status = 400;
    throw err;
  }

  const cleanDomain = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');

  if (!cleanDomain || cleanDomain.length < 3) {
    const err = new Error('Invalid domain format');
    err.status = 400;
    throw err;
  }

  const { rows } = await query(
    `INSERT INTO blocked_domains (domain)
     VALUES ($1)
     ON CONFLICT (domain) DO UPDATE SET domain = EXCLUDED.domain
     RETURNING id, domain, created_at`,
    [cleanDomain]
  );

  // Invalidate cached links so redirects immediately recognize the newly blocked domain
  await cache.invalidatePrefix('link:');

  return rows[0];
}

async function removeBlockedDomain(id) {
  const { rows } = await query(
    'DELETE FROM blocked_domains WHERE id = $1 RETURNING id, domain',
    [id]
  );
  if (!rows.length) {
    const err = new Error('Blocked domain not found');
    err.status = 404;
    throw err;
  }

  await cache.invalidatePrefix('link:');
  return { message: `Domain "${rows[0].domain}" unblocked`, id };
}

module.exports = {
  getPlatformAnalytics,
  getAllUsers,
  getAllLinks,
  setLinkStatus,
  getBlockedDomains,
  addBlockedDomain,
  removeBlockedDomain,
};
