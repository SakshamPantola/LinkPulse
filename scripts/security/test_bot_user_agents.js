/**
 * Crawler & Bot User-Agent Test Harness
 * Authored by Krishna Sijwali (@krish222334843)
 */

const botUserAgents = [
  { ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', expected: true, label: 'Googlebot' },
  { ua: 'Twitterbot/1.0', expected: true, label: 'Twitterbot' },
  { ua: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)', expected: true, label: 'Slackbot' },
  { ua: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', expected: true, label: 'Facebook Crawler' },
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', expected: false, label: 'Human Chrome' },
  { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1', expected: false, label: 'Human iOS Safari' },
];

function isKnownBot(uaString) {
  const botKeywords = ['bot', 'crawler', 'spider', 'slack', 'facebookexternalhit', 'twitterbot'];
  const lower = uaString.toLowerCase();
  return botKeywords.some(keyword => lower.includes(keyword));
}

function runBotTests() {
  console.log('🤖 Verifying Bot User-Agent Detection Rules...');
  let total = 0;
  let matches = 0;

  botUserAgents.forEach(sample => {
    total++;
    const isBot = isKnownBot(sample.ua);
    const passed = isBot === sample.expected;
    if (passed) matches++;
    console.log(`[${passed ? 'PASS ✓' : 'FAIL ✗'}] ${sample.label}: Detected as ${isBot ? 'BOT' : 'HUMAN'}`);
  });

  console.log(`\nResults: ${matches}/${total} signatures successfully verified.`);
}

if (require.main === module) {
  runBotTests();
}

module.exports = { isKnownBot, runBotTests };
