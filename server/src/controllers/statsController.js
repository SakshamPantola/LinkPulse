
const { getDashboardStats, getLinkAnalytics } = require('../services/statsService');
const { query } = require('../db');

async function dashboard(req, res, next) {
  try {
    const stats = await getDashboardStats(req.user.id, req.user.role);
    res.json({ stats });
  } catch (err) { next(err); }
}

async function linkAnalytics(req, res, next) {
  try {
    const linkId = req.params.id;

    const { rows } = await query('SELECT user_id FROM links WHERE id = $1', [linkId]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Link not found' });
    }
    if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { from, to, include_bots } = req.query;
    const analytics = await getLinkAnalytics(linkId, {
      from: from || null,
      to: to || null,
      includeBots: include_bots === 'true',
    });

    res.json({ analytics });
  } catch (err) { next(err); }
}

module.exports = { dashboard, linkAnalytics };
