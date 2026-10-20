const bcrypt = require('bcrypt');
const { query } = require('./db');
const config = require('./config');

const SALT_ROUNDS = 10;

async function ensureAdmin() {
  const adminEmail = (config.adminEmail || 'platform404@gmail.com').trim().toLowerCase();
  const adminPassword = config.adminPassword || 'Admin@123';

  try {
    const hash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
      [adminEmail, hash, 'Super Admin']
    );

    console.log(`Admin account ensured: ${adminEmail}`);
  } catch (err) {
    console.error('Failed to ensure admin account:', err.message);
  }
}

module.exports = ensureAdmin;
