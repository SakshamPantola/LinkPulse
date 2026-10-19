
const { query } = require('../db');

async function getDashboardData(userId, role, { period = '30d' } = {}) {
  const isAdmin = role === 'admin';

  let days = 30;
  if (period === '7d') days = 7;
  else if (period === '90d') days = 90;

  const userParams = isAdmin ? [] : [userId];
  const lUserFilter = isAdmin ? '' : 'WHERE l.user_id = $1';
  const cUserFilter = isAdmin ? '' : 'WHERE c.user_id = $1';

  const totalLinksRes = await query(
    `SELECT COUNT(*)::int AS count FROM links l ${lUserFilter}`,
    userParams
  );
  const totalLinks = totalLinksRes.rows[0].count;

  const activeCond = isAdmin
    ? "WHERE l.status = 'active' AND (l.expires_at IS NULL OR l.expires_at > now())"
    : "WHERE l.user_id = $1 AND l.status = 'active' AND (l.expires_at IS NULL OR l.expires_at > now())";
  const activeLinksRes = await query(
    `SELECT COUNT(*)::int AS count FROM links l ${activeCond}`,
    userParams
  );
  const activeLinks = activeLinksRes.rows[0].count;

  const clickWhereConditions = [
    `ce.clicked_at >= (NOW() - interval '${days} days')`,
    'ce.is_bot = false',
  ];
  if (!isAdmin) {
    clickWhereConditions.push('l.user_id = $1');
  }

  const clicksRes = await query(
    `SELECT COUNT(*)::int AS total_clicks,
            COUNT(DISTINCT ce.visitor_hash)::int AS unique_visitors
     FROM click_events ce
     JOIN links l ON l.id = ce.link_id
     WHERE ${clickWhereConditions.join(' AND ')}`,
    userParams
  );
  const totalClicks = clicksRes.rows[0].total_clicks;
  const uniqueVisitors = clicksRes.rows[0].unique_visitors;

  const timeSeriesRes = await query(
    `SELECT TO_CHAR(ce.clicked_at, 'YYYY-MM-DD') AS date,
            COUNT(*)::int AS clicks
     FROM click_events ce
     JOIN links l ON l.id = ce.link_id
     WHERE ${clickWhereConditions.join(' AND ')}
     GROUP BY TO_CHAR(ce.clicked_at, 'YYYY-MM-DD')
     ORDER BY date ASC`,
    userParams
  );
  const clicksOverTime = timeSeriesRes.rows.map(r => ({
    date: r.date,
    clicks: r.clicks,
  }));

  const campUserClause = isAdmin ? '' : 'WHERE c.user_id = $1';
  const campaignsRes = await query(
    `SELECT c.id, c.name,
            COUNT(DISTINCT l.id)::int AS total_links,
            COUNT(ce.id)::int AS clicks
     FROM campaigns c
     LEFT JOIN links l ON l.campaign_id = c.id
     LEFT JOIN click_events ce ON ce.link_id = l.id
          AND ce.is_bot = false
          AND ce.clicked_at >= (NOW() - interval '${days} days')
     ${campUserClause}
     GROUP BY c.id, c.name
     ORDER BY clicks DESC, c.name ASC
     LIMIT 10`,
    userParams
  );
  const campaignPerformance = campaignsRes.rows;

  const topLinksRes = await query(
    `SELECT l.id, l.short_code, l.destination_url, l.status,
            COALESCE(c.period_clicks, 0)::int AS clicks
     FROM links l
     LEFT JOIN (
       SELECT link_id, COUNT(*)::int AS period_clicks
       FROM click_events
       WHERE is_bot = false AND clicked_at >= (NOW() - interval '${days} days')
       GROUP BY link_id
     ) c ON c.link_id = l.id
     ${lUserFilter}
     ORDER BY clicks DESC, l.created_at DESC
     LIMIT 5`,
    userParams
  );
  const topLinks = topLinksRes.rows;

  const expiringRes = await query(
    `SELECT l.id, l.short_code, l.destination_url, l.expires_at
     FROM links l
     ${lUserFilter ? lUserFilter + ' AND ' : 'WHERE '}
     l.status = 'active'
     AND l.expires_at > NOW()
     AND l.expires_at <= (NOW() + interval '7 days')
     ORDER BY l.expires_at ASC`,
    userParams
  );

  const limitReachedRes = await query(
    `SELECT l.id, l.short_code, l.destination_url, l.click_limit, c.clicks
     FROM links l
     JOIN (
       SELECT link_id, COUNT(*)::int AS clicks
       FROM click_events
       WHERE is_bot = false
       GROUP BY link_id
     ) c ON c.link_id = l.id
     ${lUserFilter ? lUserFilter + ' AND ' : 'WHERE '}
     l.click_limit IS NOT NULL AND c.clicks >= l.click_limit
     ORDER BY c.clicks DESC`,
    userParams
  );

  const disabledRes = await query(
    `SELECT l.id, l.short_code, l.destination_url, l.created_at
     FROM links l
     ${lUserFilter ? lUserFilter + ' AND ' : 'WHERE '}
     l.status = 'disabled'
     ORDER BY l.created_at DESC
     LIMIT 10`,
    userParams
  );

  const botSpikeWhere = [
    `ce.clicked_at >= (NOW() - interval '${days} days')`,
  ];
  if (!isAdmin) {
    botSpikeWhere.push('l.user_id = $1');
  }

  const botSpikesRes = await query(
    `SELECT TO_CHAR(ce.clicked_at, 'YYYY-MM-DD') AS date,
            COUNT(*)::int AS total_events,
            COUNT(CASE WHEN ce.is_bot THEN 1 END)::int AS bot_clicks,
            ROUND((COUNT(CASE WHEN ce.is_bot THEN 1 END)::decimal / NULLIF(COUNT(*), 0)) * 100, 1) AS bot_percentage
     FROM click_events ce
     JOIN links l ON l.id = ce.link_id
     WHERE ${botSpikeWhere.join(' AND ')}
     GROUP BY TO_CHAR(ce.clicked_at, 'YYYY-MM-DD')
     HAVING COUNT(CASE WHEN ce.is_bot THEN 1 END) >= 5
        AND (COUNT(CASE WHEN ce.is_bot THEN 1 END)::decimal / NULLIF(COUNT(*), 0)) >= 0.20
     ORDER BY date DESC
     LIMIT 5`,
    userParams
  );

  return {
    period,
    totalLinks,
    activeLinks,
    totalClicks,
    uniqueVisitors,
    clicksOverTime,
    campaignPerformance,
    topLinks,
    alerts: {
      expiringSoon: expiringRes.rows,
      limitReached: limitReachedRes.rows,
      disabledLinks: disabledRes.rows,
      botSpikes: botSpikesRes.rows,
    },
  };
}

module.exports = { getDashboardData };
