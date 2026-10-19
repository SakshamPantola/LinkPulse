/**
 * LinkPulse - Make Admin Script
 * Run: node make-admin.js
 */
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_3lRb6Vspnthj@ep-royal-lake-b34hjs4y-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });

async function setAdmin() {
  console.log('⚡ Connecting to Neon Database to configure Admin...');
  try {
    const hash = await bcrypt.hash('Admin@123', 10);
    
    // 1. Insert or update platform404@gmail.com with role = 'admin'
    const res1 = await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('platform404@gmail.com', $1, 'PLATFORM404 Admin', 'admin')
      ON CONFLICT (email) 
      DO UPDATE SET role = 'admin', password_hash = $1
      RETURNING id, email, name, role;
    `, [hash]);

    // 2. Also insert or update admin@platform404.com with role = 'admin'
    const res2 = await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ('admin@platform404.com', $1, 'PLATFORM404 Admin', 'admin')
      ON CONFLICT (email) 
      DO UPDATE SET role = 'admin', password_hash = $1
      RETURNING id, email, name, role;
    `, [hash]);

    console.log('\n🎉 SUCCESS! Admin accounts updated with role = "admin":');
    console.log('  1.', res1.rows[0]);
    console.log('  2.', res2.rows[0]);
    console.log('\n👉 Credentials:');
    console.log('   Email:    platform404@gmail.com (or admin@platform404.com)');
    console.log('   Password: Admin@123');
    console.log('\nNow log out and log back in on the website to see the Admin panel!');
  } catch (err) {
    console.error('❌ Error configuring admin:', err);
  } finally {
    await pool.end();
  }
}

setAdmin();
