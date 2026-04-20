const {Pool} = require('pg');
const p = new Pool({connectionString: 'postgresql://nama:NamaLocal2026!@localhost:5433/nama_local', max: 1});
p.query("SELECT key, value, octet_length(value) as bytes, length(value) as chars FROM settings WHERE key='company_name'")
  .then(r => { 
    const row = r.rows[0];
    console.log('Value:', row.value);
    console.log('Bytes:', row.bytes, 'Chars:', row.chars);
    console.log('Hex:', Buffer.from(row.value).toString('hex'));
    p.end(); 
  })
  .catch(e => { console.error(e.message); p.end(); });
