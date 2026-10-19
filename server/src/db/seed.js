
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { pool, query } = require('./index');

const SALT_ROUNDS = 10;

const REFERRERS = [
  'Direct', 'google.com', 'twitter.com', 'linkedin.com',
  'github.com', 'news.ycombinator.com', 'reddit.com',
  'medium.com', 'youtube.com', 'facebook.com',
];

const DEVICES = ['Desktop', 'Desktop', 'Mobile', 'Mobile', 'Mobile', 'Tablet'];
const BROWSERS = ['Chrome', 'Chrome', 'Chrome', 'Safari', 'Safari', 'Firefox', 'Edge'];
const COUNTRIES = ['US', 'US', 'IN', 'IN', 'GB', 'DE', 'CA', 'AU', 'FR', 'JP', 'BR', 'NL'];
const SOURCES = ['link', 'link', 'link', 'link', 'qr', 'link', 'link', 'qr']; 

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.64 Mobile Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

const BOT_USER_AGENTS = [
  'Googlebot/2.1 (+http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'Twitterbot/1.0',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'AhrefsBot/7.0; +http://ahrefs.com/robot/',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIp() {
  return `${Math.floor(Math.random() * 220) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

async function masterSeed() {
  console.log('🌱 Starting LinkPulse Master Seeder...\n');

  console.log('👤 Seeding Users...');
  const adminHash = await bcrypt.hash('Admin@123', SALT_ROUNDS);
  const userHash = await bcrypt.hash('User@123', SALT_ROUNDS);

  const adminRes = await query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, email, role`,
    ['admin@linkpulse.test', adminHash, 'System Admin', 'admin']
  );
  const adminUser = adminRes.rows[0];
  console.log(`  ✓ Admin: ${adminUser.email} (Admin@123)`);

  const userRes = await query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, email, role`,
    ['user@linkpulse.test', userHash, 'Alex Turner', 'user']
  );
  const regularUser = userRes.rows[0];
  console.log(`  ✓ User:  ${regularUser.email} (User@123)`);

  console.log('\n🛡️ Seeding Blocked Domains...');
  const blockedList = ['phish-bank.com', 'scam-crypto.net', 'malware-drop.org'];
  for (const d of blockedList) {
    await query(
      'INSERT INTO blocked_domains (domain) VALUES ($1) ON CONFLICT (domain) DO NOTHING',
      [d]
    );
    console.log(`  ✓ Blocked domain: ${d} (and its subdomains)`);
  }

  console.log('\n🎯 Seeding 3 Campaigns...');
  const campaignsData = [
    { name: 'Q4 Product Launch', description: 'Global release of v2 API and enterprise dashboard features' },
    { name: 'Social Media Blitz 2026', description: 'Promotional links across Twitter, LinkedIn, and YouTube' },
    { name: 'Developer Docs & Tutorials', description: 'Developer guides, SDK links, and quickstart documentation' },
  ];

  const campaigns = [];
  for (const c of campaignsData) {
    const { rows } = await query(
      `INSERT INTO campaigns (user_id, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING id, name`,
      [regularUser.id, c.name, c.description]
    );
    if (rows.length) {
      campaigns.push(rows[0]);
    } else {
      const existing = await query('SELECT id, name FROM campaigns WHERE user_id = $1 AND name = $2', [regularUser.id, c.name]);
      campaigns.push(existing.rows[0]);
    }
    console.log(`  ✓ Campaign: "${c.name}"`);
  }

  console.log('\n🏷️ Seeding 5 Tags...');
  const tagNames = ['marketing', 'developer', 'social', 'internal', 'beta'];
  const tags = [];
  for (const t of tagNames) {
    const { rows } = await query(
      `INSERT INTO tags (user_id, name)
       VALUES ($1, $2)
       ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name`,
      [regularUser.id, t]
    );
    tags.push(rows[0]);
    console.log(`  ✓ Tag: #${t}`);
  }

  console.log('\n🔗 Seeding 25 Links with diverse states...');
  const secretPwHash = await bcrypt.hash('secret123', SALT_ROUNDS);

  const pastExpired = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const expiringSoon1 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); 
  const expiringSoon2 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(); 
  const futureExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const linksDefinition = [
    
    { alias: 'launch-q4', url: 'https://linkpulse.io/features/q4-announcement', campIdx: 0, tagIndices: [0, 1], status: 'active', limit: null, expires: null, pw: null },
    { alias: 'product-demo', url: 'https://youtube.com/watch?v=linkpulse-demo-2026', campIdx: 0, tagIndices: [0, 2], status: 'active', limit: null, expires: null, pw: null },
    { alias: 'pricing-v2', url: 'https://linkpulse.io/pricing', campIdx: 0, tagIndices: [0], status: 'active', limit: null, expires: null, pw: null },
    { alias: 'signup-special', url: 'https://linkpulse.io/register?promo=earlybird', campIdx: 0, tagIndices: [0, 4], status: 'active', limit: null, expires: null, pw: null },

    { alias: 'tw-announcement', url: 'https://twitter.com/linkpulse/status/9876543210', campIdx: 1, tagIndices: [2, 0], status: 'active', limit: null, expires: null, pw: null },
    { alias: 'li-insights', url: 'https://linkedin.com/company/linkpulse/posts', campIdx: 1, tagIndices: [2], status: 'active', limit: null, expires: null, pw: null },
    { alias: 'yt-tutorial', url: 'https://youtube.com/playlist?list=linkpulse-guides', campIdx: 1, tagIndices: [2, 1], status: 'active', limit: null, expires: null, pw: null },
    { alias: 'community-chat', url: 'https://discord.gg/linkpulse-community', campIdx: 1, tagIndices: [2, 4], status: 'active', limit: null, expires: null, pw: null },

    { alias: 'api-docs', url: 'https://docs.linkpulse.io/reference/api-v1', campIdx: 2, tagIndices: [1], status: 'active', limit: null, expires: null, pw: null },
    { alias: 'github-sdk', url: 'https://github.com/linkpulse/linkpulse-node-sdk', campIdx: 2, tagIndices: [1], status: 'active', limit: null, expires: null, pw: null },
    { alias: 'quickstart', url: 'https://docs.linkpulse.io/guides/5-minute-quickstart', campIdx: 2, tagIndices: [1, 3], status: 'active', limit: null, expires: null, pw: null },
    { alias: 'postman-spec', url: 'https://www.postman.com/linkpulse/workspace/public', campIdx: 2, tagIndices: [1], status: 'active', limit: null, expires: null, pw: null },

    { alias: 'flash-sale-2025', url: 'https://linkpulse.io/promos/black-friday', campIdx: 0, tagIndices: [0], status: 'active', limit: null, expires: pastExpired, pw: null },
    { alias: 'old-summit-pass', url: 'https://events.linkpulse.io/summit-pass', campIdx: 1, tagIndices: [2], status: 'active', limit: null, expires: pastExpired, pw: null },
    { alias: 'expired-beta-code', url: 'https://linkpulse.io/beta/join', campIdx: 2, tagIndices: [4], status: 'active', limit: null, expires: pastExpired, pw: null },

    { alias: 'spring-promo', url: 'https://linkpulse.io/promos/spring-savings', campIdx: 0, tagIndices: [0], status: 'active', limit: null, expires: expiringSoon1, pw: null },
    { alias: 'early-adopter-reg', url: 'https://linkpulse.io/register?cohort=alpha', campIdx: 1, tagIndices: [0, 4], status: 'active', limit: null, expires: expiringSoon2, pw: null },

    { alias: 'old-internal-portal', url: 'https://intranet.company.internal/old-hr', campIdx: null, tagIndices: [3], status: 'disabled', limit: null, expires: null, pw: null },
    { alias: 'deprecated-v1-api', url: 'https://api.legacy.linkpulse.io/v1/ping', campIdx: 2, tagIndices: [1], status: 'disabled', limit: null, expires: null, pw: null },
    { alias: 'cancelled-campaign', url: 'https://landing.linkpulse.io/cancelled-promo', campIdx: 1, tagIndices: [0], status: 'disabled', limit: null, expires: null, pw: null },

    { alias: 'investor-deck', url: 'https://docsend.com/view/linkpulse-series-a-deck', campIdx: 0, tagIndices: [3], status: 'active', limit: null, expires: futureExpiry, pw: secretPwHash },
    { alias: 'team-handbook', url: 'https://notion.so/linkpulse/team-handbook-2026', campIdx: null, tagIndices: [3], status: 'active', limit: null, expires: null, pw: secretPwHash },
    { alias: 'secret-beta-build', url: 'https://testflight.apple.com/join/linkpulse-v2', campIdx: 2, tagIndices: [4, 1], status: 'active', limit: null, expires: null, pw: secretPwHash },

    { alias: 'limited-first-50', url: 'https://linkpulse.io/giveaways/first-50-swag', campIdx: 0, tagIndices: [0, 4], status: 'active', limit: 35, expires: null, pw: null },
    
    { alias: 'vip-invite-pass', url: 'https://linkpulse.io/vip/exclusive-club', campIdx: 1, tagIndices: [0], status: 'active', limit: 1000, expires: futureExpiry, pw: null },
  ];

  const createdLinks = [];
  for (const item of linksDefinition) {
    const campId = item.campIdx !== null ? campaigns[item.campIdx]?.id : null;

    await query('DELETE FROM links WHERE short_code = $1', [item.alias]);

    const { rows } = await query(
      `INSERT INTO links (short_code, destination_url, user_id, campaign_id, status, expires_at, click_limit, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, short_code, status, click_limit`,
      [item.alias, item.url, regularUser.id, campId, item.status, item.expires, item.limit, item.pw]
    );

    const link = rows[0];
    createdLinks.push({ ...link, isLimitReachedLink: item.alias === 'limited-first-50' });

    for (const tagIdx of item.tagIndices) {
      if (tags[tagIdx]) {
        await query(
          'INSERT INTO link_tags (link_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [link.id, tags[tagIdx].id]
        );
      }
    }

    console.log(`  ✓ /${link.short_code} [${link.status}] → ${item.url.slice(0, 40)}`);
  }

  console.log('\n📊 Seeding ~800 Click Events across last 30 days...');

  const linkIds = createdLinks.map(l => l.id);
  await query('DELETE FROM click_events WHERE link_id = ANY($1)', [linkIds]);

  let totalClicksCount = 0;
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const dayStart = now - (daysAgo * ONE_DAY);
    const isBotSpikeDay = daysAgo === 3; 

    const dailyClickTarget = 15 + Math.floor((30 - daysAgo) * 0.7) + Math.floor(Math.random() * 10);

    for (let c = 0; c < dailyClickTarget; c++) {
      
      const link = pick(createdLinks);

      let isBot = false;
      let ua = pick(USER_AGENTS);

      if (isBotSpikeDay) {
        
        if (Math.random() < 0.35 || c < 7) {
          isBot = true;
          ua = pick(BOT_USER_AGENTS);
        }
      } else {
        
        if (Math.random() < 0.08) {
          isBot = true;
          ua = pick(BOT_USER_AGENTS);
        }
      }

      const clickTime = new Date(dayStart + Math.random() * ONE_DAY * 0.95);
      const ip = randomIp();
      const visitorHash = crypto
        .createHash('sha256')
        .update(`${ip}:${ua}:${clickTime.toISOString().slice(0, 10)}`)
        .digest('hex'); 

      const referrer = pick(REFERRERS);
      const device = isBot ? 'Desktop' : pick(DEVICES);
      const browser = isBot ? 'Unknown' : pick(BROWSERS);
      const country = pick(COUNTRIES);
      const source = pick(SOURCES);

      await query(
        `INSERT INTO click_events
           (link_id, clicked_at, referrer, device, browser, country, is_bot, visitor_hash, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [link.id, clickTime, referrer, device, browser, country, isBot, visitorHash, source]
      );

      totalClicksCount++;
    }
  }

  const limitedLink = createdLinks.find(l => l.isLimitReachedLink);
  if (limitedLink) {
    const extraClicksNeeded = 45; 
    for (let i = 0; i < extraClicksNeeded; i++) {
      const clickTime = new Date(now - Math.random() * 5 * ONE_DAY);
      const ip = randomIp();
      const ua = pick(USER_AGENTS);
      const visitorHash = crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex');

      await query(
        `INSERT INTO click_events
           (link_id, clicked_at, referrer, device, browser, country, is_bot, visitor_hash, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [limitedLink.id, clickTime, 'Direct', 'Mobile', 'Safari', 'US', false, visitorHash, 'link']
      );
      totalClicksCount++;
    }
    console.log(`  ✓ Added target clicks to /${limitedLink.short_code} so click limit alert is guaranteed active.`);
  }

  console.log(`\n✨ Successfully seeded ${totalClicksCount} click events across ${createdLinks.length} links!`);
  console.log('🎉 Master Seeding Complete!');
}

masterSeed()
  .catch(err => {
    console.error('❌ Master seed failed:', err);
    process.exit(1);
  })
  .finally(() => pool.end());
