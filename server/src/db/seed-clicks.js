
const crypto = require('crypto');
const { pool, query } = require('./index');

const referrers = ['Direct', 'google.com', 'twitter.com', 'facebook.com', 'linkedin.com', 'reddit.com', 'github.com', 'news.ycombinator.com', 'medium.com', 'Direct'];
const devices   = ['Desktop', 'Mobile', 'Mobile', 'Desktop', 'Desktop', 'Tablet', 'Desktop', 'Mobile'];
const browsers  = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Chrome', 'Chrome', 'Safari', 'Chrome', 'Firefox', 'Chrome'];
const countries = ['US', 'GB', 'DE', 'FR', 'IN', 'CA', 'AU', 'JP', 'BR', 'Unknown', 'US', 'US', 'GB', 'IN'];
const sources   = ['link', 'link', 'link', 'link', 'qr', 'link', 'link', 'qr'];
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/605 Safari/16',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605 Mobile Safari',
  'Googlebot/2.1 (+http://www.google.com/bot.html)',
  'Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomDate(daysBack = 30) {
  const now = Date.now();
  const offset = Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(now - offset);
}

async function seedClicks() {
  
  const { rows: links } = await query('SELECT id, short_code FROM links');
  if (!links.length) {
    console.log('No links found. Create some links first, then re-run.');
    return;
  }

  console.log(`Found ${links.length} link(s). Generating click events…\n`);

  let total = 0;
  for (const link of links) {
    
    const clickCount = 20 + Math.floor(Math.random() * 60);
    for (let i = 0; i < clickCount; i++) {
      const ua = pick(userAgents);
      const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      const isBot = ua.includes('bot') || ua.includes('Bot');
      const date = randomDate(30);
      const visitorHash = crypto.createHash('sha256').update(`${ip}:${ua}:${date.toISOString().slice(0, 10)}`).digest('hex').slice(0, 16);

      await query(
        `INSERT INTO click_events (link_id, clicked_at, referrer, device, browser, country, is_bot, visitor_hash, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [link.id, date, pick(referrers), pick(devices), pick(browsers), pick(countries), isBot, visitorHash, pick(sources)]
      );
      total++;
    }
    console.log(`  ✓ ${link.short_code}: ${clickCount} clicks`);
  }

  console.log(`\nSeeded ${total} click events across ${links.length} link(s).`);
}

seedClicks()
  .catch(err => { console.error('Click seed failed:', err); process.exit(1); })
  .finally(() => pool.end());
