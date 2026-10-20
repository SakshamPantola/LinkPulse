const bcrypt = require('bcrypt');
const { query } = require('../db');
const cache  = require('./cacheService');
const { cacheKey, CACHE_TTL } = require('./linkService');

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch { return null; }
}

async function isDomainBlocked(destinationUrl) {
  const domain = extractDomain(destinationUrl);
  if (!domain) return false;
  try {
    const { rows } = await query(
      `SELECT domain FROM blocked_domains
       WHERE $1 = LOWER(domain) OR $1 LIKE '%.' || LOWER(domain)
       LIMIT 1`,
      [domain]
    );
    return rows.length > 0;
  } catch (err) {
    console.error('Failed to verify domain blocklist:', err.message);
    return false;
  }
}

async function resolveCode(code) {
  const cached = await cache.get(cacheKey(code));
  if (cached) return cached;

  const { rows } = await query(
    `SELECT id, short_code, destination_url, user_id, campaign_id,
            status, expires_at, click_limit, password_hash, created_at
     FROM links
     WHERE short_code = $1`,
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

  const blocked = await isDomainBlocked(link.destination_url);
  if (blocked) {
    return { action: 'blocked', link, message: 'This destination domain has been blocked for safety reasons.' };
  }

  if (link.password_hash) {
    return { action: 'password_required', link };
  }

  // Atomic counter check & increment
  if (link.click_limit) {
    const { rows } = await query(
      `UPDATE links
       SET clicks = clicks + 1
       WHERE id = $1 AND (click_limit IS NULL OR clicks < click_limit)
       RETURNING clicks`,
      [link.id]
    );
    if (!rows.length) {
      return { action: 'limit_reached', link, message: 'This link has reached its click limit.' };
    }
  } else {
    query('UPDATE links SET clicks = clicks + 1 WHERE id = $1', [link.id]).catch(() => {});
  }

  return { action: 'redirect', link };
}

async function verifyPassword(code, password) {
  const link = await resolveCode(code);
  if (!link || !link.password_hash) return { valid: false };

  const match = await bcrypt.compare(password, link.password_hash);
  if (!match) return { valid: false, link };

  if (await isDomainBlocked(link.destination_url)) {
    return { valid: true, blocked: true, link };
  }

  if (link.click_limit) {
    const { rows } = await query(
      `UPDATE links
       SET clicks = clicks + 1
       WHERE id = $1 AND (click_limit IS NULL OR clicks < click_limit)
       RETURNING clicks`,
      [link.id]
    );
    if (!rows.length) {
      return { valid: true, limitReached: true, link };
    }
  } else {
    query('UPDATE links SET clicks = clicks + 1 WHERE id = $1', [link.id]).catch(() => {});
  }

  return { valid: true, link };
}

module.exports = { evaluateRedirect, verifyPassword, isDomainBlocked, extractDomain };
