
const crypto = require('crypto');
const { UAParser } = require('ua-parser-js');
const { isbot } = require('isbot');
const { query } = require('../db');
const cache = require('./cacheService');
const { cacheKey } = require('./linkService');
const clickQueue = require('./clickQueueService');

let geoLookup = null;
try {
  geoLookup = require('geoip-lite').lookup;
} catch {
  console.log('ℹ️  geoip-lite not available — country will default to "Unknown"');
}

function normalizeReferrer(referrer) {
  if (!referrer) return 'Direct';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    return host || 'Direct';
  } catch {
    return 'Direct';
  }
}

function normalizeDevice(uaResult) {
  const type = (uaResult.device?.type || '').toLowerCase();
  if (type === 'mobile') return 'Mobile';
  if (type === 'tablet') return 'Tablet';
  
  return 'Desktop';
}

function normalizeBrowser(uaResult) {
  return uaResult.browser?.name || 'Unknown';
}

const config = require('../config');

function computeVisitorHash(ip, userAgent) {
  const serverSalt = process.env.SALT_SECRET || config.jwt.secret || 'linkpulse-secure-salt';
  return crypto
    .createHash('sha256')
    .update(`${serverSalt}:${ip}:${userAgent}`)
    .digest('hex');
}

function resolveCountry(ip) {
  if (!geoLookup || !ip || ip === 'unknown') return 'Unknown';
  try {
    let cleanIp = ip.split(',')[0].trim();
    if (cleanIp.startsWith('::ffff:')) {
      cleanIp = cleanIp.slice(7);
    }
    if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.')) {
      return 'Local';
    }
    const geo = geoLookup(cleanIp);
    return geo?.country || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

async function handleClickJob(job) {
  const {
    linkId,
    shortCode,
    ip,
    userAgent = '',
    referrer,
    querySource, 
    blocked = false,
  } = job;

  const parser = new UAParser(userAgent);
  const uaResult = parser.getResult();

  const device  = normalizeDevice(uaResult);
  const browser = normalizeBrowser(uaResult);

  const isBotVisitor = isbot(userAgent);

  const normalizedReferrer = normalizeReferrer(referrer);

  const country = resolveCountry(ip);

  const visitorHash = computeVisitorHash(ip, userAgent);

  const source = querySource === 'qr' ? 'qr' : 'link';

  await query(
    `INSERT INTO click_events
       (link_id, referrer, device, browser, country, is_bot, visitor_hash, source, is_blocked)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [linkId, normalizedReferrer, device, browser, country, isBotVisitor, visitorHash, source, Boolean(blocked)]
  );

  // Note: Link metadata cache is preserved so redirects remain sub-millisecond fast.
}

function start() {
  clickQueue.process(handleClickJob);
  console.log('⚙️  Click worker started');
}

module.exports = { start, handleClickJob };
