const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { isbot } = require('isbot');
const { UAParser } = require('ua-parser-js');

describe('Bot Detection & Device Normalization', () => {
  it('should flag automated web crawlers and search engine bots', () => {
    const googleBot = 'Googlebot/2.1 (+http://www.google.com/bot.html)';
    const bingBot = 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';
    const twitterBot = 'Twitterbot/1.0';
    const scraperBot = 'curl/7.68.0';

    assert.equal(isbot(googleBot), true);
    assert.equal(isbot(bingBot), true);
    assert.equal(isbot(twitterBot), true);
    assert.equal(isbot(scraperBot), true);
  });

  it('should recognize real human browser traffic as non-bot', () => {
    const chromeDesktop = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    const safariMobile = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1';

    assert.equal(isbot(chromeDesktop), false);
    assert.equal(isbot(safariMobile), false);
  });

  it('should correctly parse mobile and desktop device types', () => {
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';

    const desktopParser = new UAParser(desktopUA);
    const mobileParser = new UAParser(mobileUA);

    assert.equal(desktopParser.getResult().device.type, undefined); // Desktop has undefined type in UAParser
    assert.equal(mobileParser.getResult().device.type, 'mobile');
  });
});
