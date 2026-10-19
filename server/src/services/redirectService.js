
const bcrypt = require('bcrypt');
const { query } = require('../db');
const cache  = require('./cacheService');
const { cacheKey, CACHE_TTL } = require('./linkService');

async function resolveCode(code) {
  
  const cached = await cache.get(cacheKey(code));
  if (cached) return cached;

  const { rows } = await query(
    `SELECT l.*,
            COALESCE(c.click_count, 0)::int AS click_count
     FROM links l
     LEFT JOIN (
       SELECT link_id, COUNT(*) AS click_count
       FROM click_events
       WHERE is_bot = false AND is_blocked = false
       GROUP BY link_id
     ) c ON c.link_id = l.id
     WHERE l.short_code = $1`,
    [code]
  );

  if (!rows.length) return null;

  const link = rows[0];
  await cache.set(cacheKey(code), link, CACHE_TTL);
  return link;
}

async function evaluateRedirect(code) {
  
  const link = await resolveCode(code);
  if (!link) return { action: 'not_found' };

  if (link.status !== 'active') {
    return { action: 'disabled', link, message: 'This link has been disabled.' };
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { action: 'expired', link, message: 'This link has expired.' };
  }

  if (link.click_limit) {
    const { rows } = await query(
      'SELECT COUNT(*)::int AS cnt FROM click_events WHERE link_id = $1 AND is_bot = false AND is_blocked = false',
      [link.id]
    );
    if (rows[0].cnt >= link.click_limit) {
      return { action: 'limit_reached', link, message: 'This link has reached its click limit.' };
    }
  }

  if (link.password_hash) {
    return { action: 'password_required', link };
  }

  return { action: 'redirect', link };
}

async function verifyPassword(code, password) {
  const link = await resolveCode(code);
  if (!link || !link.password_hash) return { valid: false };

  const match = await bcrypt.compare(password, link.password_hash);
  return { valid: match, link };
}

module.exports = { evaluateRedirect, verifyPassword };
