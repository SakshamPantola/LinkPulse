
const { query } = require('../db');

async function getDashboardStats(userId, role) {
  const isAdmin = role === 'admin';

  const userFilter = isAdmin ? '' : 'WHERE l.user_id = $1';
  const params = isAdmin ? [] : [userId];

  const totalLinks = await query(
    `SELECT COUNT(*)::int AS count FROM links l ${userFilter}`, params
  );

  const activeCond = isAdmin
    ? "WHERE l.status = 'active' AND (l.expires_at IS NULL OR l.expires_at > now())"
    : "WHERE l.user_id = $1 AND l.status = 'active' AND (l.expires_at IS NULL OR l.expires_at > now())";
  const activeLinks = await query(
    `SELECT COUNT(*)::int AS count FROM links l ${activeCond}`, params
  );

  const clickFilter = isAdmin
    ? ''
    : 'JOIN links l ON l.id = ce.link_id WHERE l.user_id = $1';
  const totalClicks = await query(
    `SELECT COUNT(*)::int AS count FROM click_events ce ${clickFilter}`, params
  );

  const campFilter = isAdmin ? '' : 'WHERE c.user_id = $1';
  const campaigns = await query(
    `SELECT COUNT(*)::int AS count FROM campaigns c ${campFilter}`, params
  );

  return {
    totalLinks:  totalLinks.rows[0].count,
    totalClicks: totalClicks.rows[0].count,
    activeLinks: activeLinks.rows[0].count,
    campaigns:   campaigns.rows[0].count,
  };
}

async function getLinkAnalytics(linkId, { from, to, includeBots = false } = {}) {
  
  const conditions = ['ce.link_id = $1'];
  const params = [linkId];

  if (!includeBots) {
    conditions.push('ce.is_bot = false');
  }

  if (from) {
    params.push(from);
    conditions.push(`ce.clicked_at >= $${params.length}::date`);
  }
  if (to) {
    params.push(to);
    
    conditions.push(`ce.clicked_at < ($${params.length}::date + interval '1 day')`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const totalResult = await query(
    `SELECT COUNT(*)::int AS total FROM click_events ce ${where}`,
    params
  );
  const totalClicks = totalResult.rows[0].total;

  const uniqueResult = await query(
    `SELECT COUNT(DISTINCT ce.visitor_hash)::int AS unique_visitors
     FROM click_events ce ${where}`,
    params
  );
  const uniqueVisitors = uniqueResult.rows[0].unique_visitors;

  const timeSeriesResult = await query(
    `SELECT TO_CHAR(ce.clicked_at, 'YYYY-MM-DD') AS date,
            COUNT(*)::int AS clicks
     FROM click_events ce ${where}
     GROUP BY TO_CHAR(ce.clicked_at, 'YYYY-MM-DD')
     ORDER BY date ASC`,
    params
  );
  const clicksOverTime = timeSeriesResult.rows.map(r => ({
    date: r.date,
    clicks: r.clicks,
  }));

  const referrersResult = await query(
    `SELECT ce.referrer,
            COUNT(*)::int AS clicks
     FROM click_events ce ${where}
     GROUP BY ce.referrer
     ORDER BY clicks DESC
     LIMIT 10`,
    params
  );
  const topReferrers = referrersResult.rows;

  const devicesResult = await query(
    `SELECT ce.device,
            COUNT(*)::int AS clicks
     FROM click_events ce ${where}
     GROUP BY ce.device
     ORDER BY clicks DESC`,
    params
  );
  const deviceSplit = devicesResult.rows;

  const browsersResult = await query(
    `SELECT ce.browser,
            COUNT(*)::int AS clicks
     FROM click_events ce ${where}
     GROUP BY ce.browser
     ORDER BY clicks DESC
     LIMIT 10`,
    params
  );
  const browserSplit = browsersResult.rows;

  const countriesResult = await query(
    `SELECT ce.country,
            COUNT(*)::int AS clicks
     FROM click_events ce ${where}
     GROUP BY ce.country
     ORDER BY clicks DESC
     LIMIT 10`,
    params
  );
  const countrySplit = countriesResult.rows;

  const sourceResult = await query(
    `SELECT ce.source,
            COUNT(*)::int AS clicks
     FROM click_events ce ${where}
     GROUP BY ce.source
     ORDER BY clicks DESC`,
    params
  );
  const sourceSplit = sourceResult.rows;

  return {
    totalClicks,
    uniqueVisitors,
    clicksOverTime,
    topReferrers,
    deviceSplit,
    browserSplit,
    countrySplit,
    sourceSplit,
  };
}

module.exports = { getDashboardStats, getLinkAnalytics };
