const { Client } = require('pg');
const c = new Client({
  host: 'localhost',
  port: 5433,
  user: 'nama',
  password: 'NamaLocal2026!',
  database: 'nama_local',
});

c.connect()
  .then(() => c.query("UPDATE settings SET value = 'نماء سوفت' WHERE key = 'company_name'"))
  .then(r => { console.log('Updated:', r.rowCount, 'rows'); return c.end(); })
  .catch(e => { console.error(e.message); process.exit(1); });
