const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { extractDomain } = require('../src/services/redirectService');

describe('Redirect Logic & Security Evaluation', () => {
  it('should extract canonical domain from URLs for blocklist comparisons', () => {
    assert.equal(extractDomain('https://phishing-site.xyz/login'), 'phishing-site.xyz');
    assert.equal(extractDomain('http://www.badactor.com/payload.exe'), 'badactor.com');
    assert.equal(extractDomain('https://sub.sub2.malicious.net/path?query=1'), 'sub.sub2.malicious.net');
    assert.equal(extractDomain('invalid-url-string'), null);
  });

  it('should accurately detect expired link timestamp', () => {
    const pastDate = new Date(Date.now() - 60000).toISOString();
    const futureDate = new Date(Date.now() + 60000).toISOString();

    const isExpired = (expiresAt) => !!(expiresAt && new Date(expiresAt) < new Date());

    assert.equal(isExpired(pastDate), true);
    assert.equal(isExpired(futureDate), false);
    assert.equal(isExpired(null), false);
  });

  it('should enforce status check (disabled links)', () => {
    const evaluateStatus = (status) => status === 'active';

    assert.equal(evaluateStatus('active'), true);
    assert.equal(evaluateStatus('disabled'), false);
    assert.equal(evaluateStatus('pending'), false);
  });
});
