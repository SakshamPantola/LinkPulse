
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

function computeVisitorHash(ip, userAgent) {
  
  const dailySalt = new Date().toISOString().slice(0, 10); 
  return crypto
    .createHash('sha256')
    .update(`${ip}:${userAgent}:${dailySalt}`)
    .digest('hex');
}

function resolveCountry(ip) {
  if (!geoLookup || !ip) return 'Unknown';
  try {
    let cleanIp = ip.split(',')[0].trim();
    if (cleanIp.startsWith('::ffff:')) {
      cleanIp = cleanIp.slice(7);
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

  await cache.del(cacheKey(shortCode));
}

function start() {
  clickQueue.process(handleClickJob);
  console.log('⚙️  Click worker started');
}

module.exports = { start, handleClickJob };
