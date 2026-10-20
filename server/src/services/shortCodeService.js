
const { query } = require('../db');

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const CODE_LENGTH = 7;
const MAX_RETRIES = 5;

function randomBase62(len = CODE_LENGTH) {
  let code = '';
  const bytes = require('crypto').randomBytes(len);
  for (let i = 0; i < len; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = randomBase62();
    const { rows } = await query(
      'SELECT 1 FROM links WHERE short_code = $1', [code]
    );
    if (rows.length === 0) return code;
  }
  throw new Error('Failed to generate unique short code after max retries');
}

const RESERVED_WORDS = new Set([
  'api', 'admin', 'login', 'dashboard', 'register',
  'health', 'links', 'campaigns', 'analytics', 'qr',
]);

function isReserved(alias) {
  return RESERVED_WORDS.has(alias.toLowerCase());
}

function isValidAlias(alias) {
  return typeof alias === 'string' && /^[a-zA-Z0-9_-]+$/.test(alias) && alias.length >= 2 && alias.length <= 20;
}

module.exports = { generateUniqueCode, isReserved, isValidAlias, RESERVED_WORDS };
