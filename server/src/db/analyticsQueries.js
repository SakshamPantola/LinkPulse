const { pool } = require('./index');

/**
 * Aggregates daily click counts within a given timeframe for chart rendering
 */
async function getDailyClickTimeSeries(linkId, days = 30) {
  const queryText = `
    SELECT
      DATE_TRUNC('day', clicked_at)::DATE AS click_date,
      COUNT(*) AS total_clicks,
      COUNT(*) FILTER (WHERE is_bot = false AND is_blocked = false) AS human_clicks,
      COUNT(*) FILTER (WHERE is_bot = true) AS bot_clicks
    FROM click_events
    WHERE link_id = $1
      AND clicked_at >= NOW() - ($2 || ' days')::INTERVAL
    GROUP BY click_date
    ORDER BY click_date ASC;
  `;

  const { rows } = await pool.query(queryText, [linkId, days]);
  return rows;
}

/**
 * Returns top 10 country sources for a given link with human-verified traffic counts
 */
async function getTopCountries(linkId, limit = 10) {
  const queryText = `
    SELECT
      COALESCE(country_code, 'UNKNOWN') AS country_code,
      COUNT(*) AS total_clicks
    FROM click_events
    WHERE link_id = $1
      AND is_bot = false
      AND is_blocked = false
    GROUP BY country_code
    ORDER BY total_clicks DESC
    LIMIT $2;
  `;

  const { rows } = await pool.query(queryText, [linkId, limit]);
  return rows;
}

/**
 * Returns normalized device breakdown (Mobile vs Desktop vs Tablet)
 */
async function getDeviceBreakdown(linkId) {
  const queryText = `
    SELECT
      COALESCE(device_type, 'desktop') AS device_type,
      COUNT(*) AS count
    FROM click_events
    WHERE link_id = $1
      AND is_bot = false
      AND is_blocked = false
    GROUP BY device_type
    ORDER BY count DESC;
  `;

  const { rows } = await pool.query(queryText, [linkId]);
  return rows;
}

module.exports = {
  getDailyClickTimeSeries,
  getTopCountries,
  getDeviceBreakdown,
};
