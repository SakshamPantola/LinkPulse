
const fs   = require('fs');
const path = require('path');
const { pool, query } = require('./index');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function run() {
  
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows: applied } = await query('SELECT name FROM _migrations ORDER BY name');
  const appliedSet = new Set(applied.map(r => r.name));

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`  ✓ ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    console.log(`  ▸ Applying ${file} …`);
    await query(sql);
    await query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
    console.log(`  ✓ ${file}`);
  }

  console.log('\nAll migrations applied.');
}

run()
  .catch(err => { console.error('Migration failed:', err); process.exit(1); })
  .finally(() => pool.end());
