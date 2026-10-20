
const bcrypt = require('bcrypt');
const { z }  = require('zod');
const { query } = require('../db');
const cache     = require('./cacheService');
const { generateUniqueCode, isReserved, isValidAlias } = require('./shortCodeService');

const SALT_ROUNDS = 10;
const CACHE_TTL   = 60; 

const urlRegex = /^https?:\/\/.+/;

const validateSchema = z.object({
  destination_url: z.string().min(1, 'URL is required'),
  alias:           z.string().optional(),
});

const createSchema = z.object({
  destination_url: z.string().min(1, 'URL is required'),
  alias:           z.string().trim().min(2, 'Alias must be at least 2 characters').max(20, 'Alias cannot exceed 20 characters').optional(),
  expires_at:      z.string().datetime({ offset: true }).optional().nullable(),
  click_limit:     z.number().int().positive().optional().nullable(),
  password:        z.string().min(1).optional().nullable(),
  campaign_id:     z.string().uuid().optional().nullable(),
  tags:            z.array(z.string().min(1).max(100)).optional(),
});

const updateSchema = z.object({
  destination_url: z.string().min(1).optional(),
  status:          z.enum(['active', 'disabled']).optional(),
  expires_at:      z.string().datetime({ offset: true }).optional().nullable(),
  click_limit:     z.number().int().positive().optional().nullable(),
  password:        z.string().optional().nullable(),
  campaign_id:     z.string().uuid().optional().nullable(),
  reset_clicks:    z.boolean().optional(),
});

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch { return null; }
}

function cacheKey(code) { return `link:${code}`; }

async function invalidateLink(code) {
  await cache.del(cacheKey(code));
}

function auditUrlSecurity(urlStr) {
  let score = 100;
  const checks = [];
  const flags = [];

  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    return {
      score: 0,
      status: 'danger',
      checks: [{ name: 'URL Integrity', passed: false, detail: 'Malformed or unparseable URL' }],
    };
  }

  const isHttps = parsed.protocol === 'https:';
  if (isHttps) {
    checks.push({ name: 'SSL / TLS Encryption', passed: true, detail: 'Secure HTTPS protocol active' });
  } else {
    score -= 25;
    checks.push({ name: 'SSL / TLS Encryption', passed: false, detail: 'Insecure plain HTTP protocol' });
    flags.push('Unencrypted Protocol');
  }

  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname);
  if (isIp) {
    score -= 40;
    checks.push({ name: 'Host Resolvability', passed: false, detail: 'Direct numerical IP address detected (High Risk)' });
    flags.push('Direct IP Destination');
  } else {
    checks.push({ name: 'Host Resolvability', passed: true, detail: `Standard FQDN domain (${parsed.hostname})` });
  }

  const hostname = parsed.hostname.toLowerCase();
  const highRiskTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.top', '.xyz', '.work', '.click', '.loan', '.buzz'];
  const hasHighRiskTld = highRiskTlds.some(tld => hostname.endsWith(tld));
  if (hasHighRiskTld) {
    score -= 15;
    checks.push({ name: 'TLD Reputation', passed: false, detail: 'Target uses a known high-abuse / spam TLD extension' });
    flags.push('High-Risk TLD');
  } else {
    checks.push({ name: 'TLD Reputation', passed: true, detail: 'Standard commercial or country-code TLD' });
  }

  const suspiciousKeywords = ['login', 'verify', 'account-update', 'paypal', 'metamask', 'banking', 'secure-signin', 'appleid', 'netflix-verify', 'wellsfargo', 'binance'];
  const matchedKeyword = suspiciousKeywords.find(kw => (hostname.includes(kw) || parsed.pathname.includes(kw)) && !hostname.includes(kw + '.com'));
  if (matchedKeyword) {
    score -= 25;
    checks.push({ name: 'Phishing Heuristics', passed: false, detail: `Sensitive credential keyword found: "${matchedKeyword}"` });
    flags.push('Phishing Keyword Risk');
  } else {
    checks.push({ name: 'Phishing Heuristics', passed: true, detail: 'No deceptive credential-harvesting patterns' });
  }

  const dangerousExtensions = ['.exe', '.scr', '.bat', '.cmd', '.msi', '.vbs', '.apk', '.jar', '.sh'];
  const hasDangerousExt = dangerousExtensions.some(ext => parsed.pathname.toLowerCase().endsWith(ext));
  if (hasDangerousExt) {
    score -= 50;
    checks.push({ name: 'Executable Attachment', passed: false, detail: 'Target points directly to an executable binary' });
    flags.push('Executable File');
  } else {
    checks.push({ name: 'Payload Safety', passed: true, detail: 'No direct binary download extension' });
  }

  const shortenerDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'buff.ly', 'ow.ly'];
  const isNestedShortener = shortenerDomains.some(d => hostname.includes(d));
  if (isNestedShortener) {
    score -= 15;
    checks.push({ name: 'Shortener Recursion', passed: false, detail: 'Target is already a URL shortener (obfuscation risk)' });
    flags.push('Chained Shortener');
  }

  score = Math.max(10, Math.min(100, score));
  const status = score >= 80 ? 'safe' : score >= 50 ? 'warning' : 'danger';

  return { score, status, flags, checks };
}

async function validateLink({ destination_url, alias }) {
  const errors   = [];
  const warnings = [];

  if (!urlRegex.test(destination_url)) {
    errors.push('URL must start with http:// or https://');
  } else {
    try { new URL(destination_url); }
    catch { errors.push('Invalid URL format'); }
  }

  const security = auditUrlSecurity(destination_url);

  if (errors.length === 0) {
    const domain = extractDomain(destination_url);
    if (domain) {
      const cleanDomain = domain.toLowerCase();
      const { rows } = await query(
        `SELECT domain FROM blocked_domains
         WHERE $1 = LOWER(domain) OR $1 LIKE '%.' || LOWER(domain)
         LIMIT 1`,
        [cleanDomain]
      );
      if (rows.length) {
        errors.push(`Domain "${domain}" (or parent domain "${rows[0].domain}") is blocked`);
      }
    }

    if (destination_url.startsWith('http://')) {
      warnings.push('Insecure HTTP protocol detected. Consider using HTTPS for better security.');
    }

    if (/[?&](utm_|fbclid|gclid|ref=)/i.test(destination_url)) {
      warnings.push('Destination URL contains tracking parameters (e.g. UTM/ad tags). Ensure these are intended.');
    }
  }

  if (alias) {
    if (alias.length < 2 || alias.length > 20) {
      errors.push('Alias must be between 2 and 20 characters');
    } else if (!isValidAlias(alias)) {
      errors.push('Alias may only contain letters, numbers, hyphens, and underscores');
    } else if (isReserved(alias)) {
      errors.push(`"${alias}" is a reserved word`);
    } else {
      const { rows } = await query(
        'SELECT 1 FROM links WHERE short_code = $1', [alias]
      );
      if (rows.length) {
        errors.push('Alias is already taken');
      } else if (alias.length < 4) {
        warnings.push('Short alias (< 4 characters) might be easily guessed or mistyped.');
      }
    }
  } else {
    warnings.push('No custom alias provided. An automatic 7-character code will be generated.');
  }

  return { valid: errors.length === 0, errors, warnings, security };
}

async function createLink(userId, body) {
  const data = createSchema.parse(body);

  const { valid, errors } = await validateLink({
    destination_url: data.destination_url,
    alias: data.alias,
  });
  if (!valid) {
    const err = new Error(errors.join('; '));
    err.status = 400;
    throw err;
  }

  if (data.expires_at) {
    const expDate = new Date(data.expires_at);
    if (isNaN(expDate.getTime()) || expDate <= new Date()) {
      const err = new Error('Expiration date must be a valid future date');
      err.status = 400;
      throw err;
    }
  }

  const shortCode = data.alias || await generateUniqueCode();

  const passwordHash = data.password
    ? await bcrypt.hash(data.password, SALT_ROUNDS)
    : null;

  let link;
  try {
    const { rows } = await query(
      `INSERT INTO links (short_code, destination_url, user_id, campaign_id,
                          expires_at, click_limit, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [shortCode, data.destination_url, userId,
       data.campaign_id || null, data.expires_at || null,
       data.click_limit || null, passwordHash]
    );
    link = rows[0];
  } catch (dbErr) {
    if (dbErr.code === '23505') {
      const err = new Error('Short code or alias already taken. Please choose another.');
      err.status = 409;
      throw err;
    }
    throw dbErr;
  }

  if (data.tags?.length) {
    for (const tagName of data.tags) {
      
      const { rows: tagRows } = await query(
        `INSERT INTO tags (user_id, name)
         VALUES ($1, $2)
         ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [userId, tagName.trim()]
      );
      await query(
        `INSERT INTO link_tags (link_id, tag_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [link.id, tagRows[0].id]
      );
    }
  }

  return enrichLink(link);
}

async function getLinks(userId, role, { page = 1, limit = 20, search = '', tag = '' }) {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (role !== 'admin') {
    params.push(userId);
    conditions.push(`l.user_id = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(l.short_code ILIKE $${params.length} OR l.destination_url ILIKE $${params.length})`);
  }

  let tagJoin = '';
  if (tag) {
    params.push(tag.trim());
    tagJoin = 'JOIN link_tags flt ON flt.link_id = l.id JOIN tags ftg ON ftg.id = flt.tag_id';
    conditions.push(`ftg.name ILIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(DISTINCT l.id) AS total FROM links l ${tagJoin} ${where}`, params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const dataParams = [...params, limit, offset];
  const { rows } = await query(
    `SELECT l.*,
            GREATEST(COALESCE(l.clicks, 0), COALESCE(c.click_count, 0))::int AS click_count,
            camp.name AS campaign_name
     FROM links l
     ${tagJoin}
     LEFT JOIN (
       SELECT link_id, COUNT(*) AS click_count FROM click_events WHERE is_bot = false AND is_blocked = false GROUP BY link_id
     ) c ON c.link_id = l.id
     LEFT JOIN campaigns camp ON camp.id = l.campaign_id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  const enriched = await Promise.all(rows.map(enrichLink));

  return {
    links: enriched,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function getLinkById(linkId, userId, role) {
  const { rows } = await query(
    `SELECT l.*,
            GREATEST(COALESCE(l.clicks, 0), COALESCE(c.click_count, 0))::int AS click_count,
            camp.name AS campaign_name
     FROM links l
     LEFT JOIN (
       SELECT link_id, COUNT(*) AS click_count FROM click_events WHERE is_bot = false AND is_blocked = false GROUP BY link_id
     ) c ON c.link_id = l.id
     LEFT JOIN campaigns camp ON camp.id = l.campaign_id
     WHERE l.id = $1`, [linkId]
  );
  if (!rows.length) {
    const err = new Error('Link not found');
    err.status = 404;
    throw err;
  }
  const link = rows[0];

  if (role !== 'admin' && link.user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  return enrichLink(link);
}

async function updateLink(linkId, userId, role, body) {
  const data = updateSchema.parse(body);

  const { rows: existing } = await query('SELECT * FROM links WHERE id = $1', [linkId]);
  if (!existing.length) {
    const err = new Error('Link not found');
    err.status = 404;
    throw err;
  }
  const link = existing[0];
  if (role !== 'admin' && link.user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  if (data.destination_url && data.destination_url !== link.destination_url) {
    const { valid, errors } = await validateLink({ destination_url: data.destination_url });
    if (!valid) {
      const err = new Error(errors.join('; '));
      err.status = 400;
      throw err;
    }
  }

  const fields = [];
  const params = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (key === 'reset_clicks') continue; 
    
    if (key === 'password') {
      params.push(value ? await bcrypt.hash(value, SALT_ROUNDS) : null);
      fields.push(`password_hash = $${params.length}`);
    } else {
      params.push(value);
      fields.push(`${key} = $${params.length}`);
    }
  }

  if (data.expires_at) {
    const expDate = new Date(data.expires_at);
    if (isNaN(expDate.getTime()) || expDate <= new Date()) {
      const err = new Error('Expiration date must be a valid future date');
      err.status = 400;
      throw err;
    }
  }

  if (data.reset_clicks) {
    await query('DELETE FROM click_events WHERE link_id = $1', [linkId]);
    await query('UPDATE links SET clicks = 0 WHERE id = $1', [linkId]);
    await invalidateLink(link.short_code);
  }

  if (fields.length === 0) {
    return enrichLink(link);
  }

  params.push(linkId);
  const { rows: updated } = await query(
    `UPDATE links SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );

  await invalidateLink(link.short_code);

  return enrichLink(updated[0]);
}

async function disableLink(linkId, userId, role) {
  const { rows } = await query('SELECT * FROM links WHERE id = $1', [linkId]);
  if (!rows.length) {
    const err = new Error('Link not found');
    err.status = 404;
    throw err;
  }
  const link = rows[0];
  if (role !== 'admin' && link.user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  await query("UPDATE links SET status = 'disabled' WHERE id = $1", [linkId]);
  await invalidateLink(link.short_code);

  return { message: 'Link disabled' };
}

async function enrichLink(link) {
  const { rows: tags } = await query(
    `SELECT t.id, t.name FROM tags t
     JOIN link_tags lt ON lt.tag_id = t.id
     WHERE lt.link_id = $1`,
    [link.id]
  );
  return {
    ...link,
    tags,
    has_password: !!link.password_hash,
    password_hash: undefined, 
  };
}

module.exports = {
  validateLink,
  createLink,
  getLinks,
  getLinkById,
  updateLink,
  disableLink,
  cacheKey,
  invalidateLink,
  CACHE_TTL,
};
