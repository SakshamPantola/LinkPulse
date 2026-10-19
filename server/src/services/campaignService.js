
const { query } = require('../db');

async function getCampaigns(userId, role) {
  const isAdmin = role === 'admin';
  const filterClause = isAdmin ? '' : 'WHERE c.user_id = $1';
  const params = isAdmin ? [] : [userId];

  const { rows } = await query(
    `SELECT c.*,
            COALESCE(l.link_count, 0)::int AS total_links,
            COALESCE(st.total_clicks, 0)::int AS total_clicks,
            COALESCE(st.unique_visitors, 0)::int AS unique_visitors
     FROM campaigns c
     LEFT JOIN (
       SELECT campaign_id, COUNT(*) AS link_count
       FROM links
       WHERE campaign_id IS NOT NULL
       GROUP BY campaign_id
     ) l ON l.campaign_id = c.id
     LEFT JOIN (
       SELECT l.campaign_id,
              COUNT(*)::int AS total_clicks,
              COUNT(DISTINCT ce.visitor_hash)::int AS unique_visitors
       FROM click_events ce
       JOIN links l ON l.id = ce.link_id
       WHERE l.campaign_id IS NOT NULL AND ce.is_bot = false
       GROUP BY l.campaign_id
     ) st ON st.campaign_id = c.id
     ${filterClause}
     ORDER BY c.created_at DESC`,
    params
  );

  return rows;
}

async function getCampaignById(campaignId, userId, role) {
  const { rows } = await query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
  if (!rows.length) {
    const err = new Error('Campaign not found');
    err.status = 404;
    throw err;
  }
  const campaign = rows[0];
  if (role !== 'admin' && campaign.user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  const statsRes = await query(
    `SELECT COUNT(DISTINCT l.id)::int AS total_links,
            COUNT(ce.id)::int AS total_clicks,
            COUNT(DISTINCT ce.visitor_hash)::int AS unique_visitors
     FROM links l
     LEFT JOIN click_events ce ON ce.link_id = l.id AND ce.is_bot = false
     WHERE l.campaign_id = $1`,
    [campaignId]
  );
  const stats = statsRes.rows[0];

  const linksRes = await query(
    `SELECT l.id,
            l.short_code,
            l.destination_url,
            l.status,
            l.created_at,
            COALESCE(c.click_count, 0)::int AS click_count
     FROM links l
     LEFT JOIN (
       SELECT link_id, COUNT(*)::int AS click_count
       FROM click_events
       WHERE is_bot = false
       GROUP BY link_id
     ) c ON c.link_id = l.id
     WHERE l.campaign_id = $1
     ORDER BY click_count DESC, l.created_at DESC`,
    [campaignId]
  );

  return {
    ...campaign,
    total_links: stats.total_links,
    total_clicks: stats.total_clicks,
    unique_visitors: stats.unique_visitors,
    links: linksRes.rows,
  };
}

async function createCampaign(userId, { name, description }) {
  if (!name || !name.trim()) {
    const err = new Error('Campaign name is required');
    err.status = 400;
    throw err;
  }

  const { rows } = await query(
    `INSERT INTO campaigns (user_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, name.trim(), description?.trim() || null]
  );

  return {
    ...rows[0],
    total_links: 0,
    total_clicks: 0,
    unique_visitors: 0,
  };
}

async function updateCampaign(campaignId, userId, role, { name, description }) {
  const { rows: existing } = await query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
  if (!existing.length) {
    const err = new Error('Campaign not found');
    err.status = 404;
    throw err;
  }
  if (role !== 'admin' && existing[0].user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  const fields = [];
  const params = [];

  if (name !== undefined) {
    if (!name.trim()) {
      const err = new Error('Campaign name cannot be empty');
      err.status = 400;
      throw err;
    }
    params.push(name.trim());
    fields.push(`name = $${params.length}`);
  }

  if (description !== undefined) {
    params.push(description?.trim() || null);
    fields.push(`description = $${params.length}`);
  }

  if (!fields.length) return existing[0];

  params.push(campaignId);
  const { rows } = await query(
    `UPDATE campaigns SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rows[0];
}

async function deleteCampaign(campaignId, userId, role) {
  const { rows: existing } = await query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
  if (!existing.length) {
    const err = new Error('Campaign not found');
    err.status = 404;
    throw err;
  }
  if (role !== 'admin' && existing[0].user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  await query('DELETE FROM campaigns WHERE id = $1', [campaignId]);
  return { message: 'Campaign deleted successfully' };
}

module.exports = {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
};
