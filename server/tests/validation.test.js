const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { isValidAlias, isReserved } = require('../src/services/shortCodeService');

describe('Alias & Short Code Validation', () => {
  it('should accept valid aliases between 2 and 20 characters', () => {
    assert.equal(isValidAlias('my-link'), true);
    assert.equal(isValidAlias('promo2024'), true);
    assert.equal(isValidAlias('cool_deal'), true);
    assert.equal(isValidAlias('ab'), true);
    assert.equal(isValidAlias('12345678901234567890'), true); // 20 chars
  });

  it('should reject aliases exceeding 20 characters (PostgreSQL VARCHAR(20) safeguard)', () => {
    assert.equal(isValidAlias('this-alias-is-way-too-long-for-db'), false);
    assert.equal(isValidAlias('123456789012345678901'), false); // 21 chars
  });

  it('should reject aliases with invalid characters or too short', () => {
    assert.equal(isValidAlias('a'), false); // < 2 chars
    assert.equal(isValidAlias('invalid@name'), false);
    assert.equal(isValidAlias('hello world'), false);
    assert.equal(isValidAlias('link/path'), false);
    assert.equal(isValidAlias(''), false);
    assert.equal(isValidAlias(null), false);
  });

  it('should identify reserved routing words', () => {
    assert.equal(isReserved('api'), true);
    assert.equal(isReserved('admin'), true);
    assert.equal(isReserved('dashboard'), true);
    assert.equal(isReserved('login'), true);
    assert.equal(isReserved('health'), true);
    assert.equal(isReserved('my-custom-campaign'), false);
  });
});
