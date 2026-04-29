const { Pool } = require('pg');
const p = new Pool({connectionString: 'postgresql://nama:NamaLocal2026!@localhost:5433/nama_local', max: 1});

async function resetAll() {
  console.log('🗑️ Resetting all data...\n');
  
  // Get all tables
  const res = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  const tables = res.rows.map(r => r.table_name);
  
  console.log(`Found ${tables.length} tables`);
  
  // Disable FK checks and truncate all
  await p.query('SET session_replication_role = replica');
  
  for (const table of tables) {
    try {
      await p.query(`TRUNCATE TABLE "${table}" CASCADE`);
      console.log(`  ✅ Cleared: ${table}`);
    } catch (e) {
      console.log(`  ⚠️ Skip: ${table} — ${e.message}`);
    }
  }
  
  await p.query('SET session_replication_role = DEFAULT');
  
  console.log('\n✅ All data cleared!');
  await p.end();
}

resetAll().catch(e => { console.error(e.message); p.end(); });
