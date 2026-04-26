const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      console.log(`Executing: ${cmd.slice(0, 80)}...`);
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { process.stdout.write(d); out += d; });
        stream.stderr.on('data', d => { process.stderr.write(d); out += d; });
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

(async () => {
  const sql = `CREATE TABLE IF NOT EXISTS work_shifts (id SERIAL PRIMARY KEY, name TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, break_mins INTEGER DEFAULT 60, active BOOLEAN DEFAULT true); CREATE TABLE IF NOT EXISTS vendor_ratings (id SERIAL PRIMARY KEY, supplier_id INTEGER NOT NULL, grn_id INTEGER, quality INTEGER DEFAULT 5, delivery INTEGER DEFAULT 5, pricing INTEGER DEFAULT 5, notes TEXT, rated_by INTEGER, rated_at TIMESTAMP DEFAULT NOW()); CREATE TABLE IF NOT EXISTS fiscal_periods (id SERIAL PRIMARY KEY, year INTEGER NOT NULL, month INTEGER NOT NULL, status TEXT DEFAULT 'open', closed_by INTEGER, closed_at TIMESTAMP, notes TEXT, UNIQUE(year, month)); CREATE TABLE IF NOT EXISTS service_tickets (id SERIAL PRIMARY KEY, ticket_no INTEGER NOT NULL, customer_id INTEGER, technician_id INTEGER, type TEXT DEFAULT 'repair', priority TEXT DEFAULT 'normal', description TEXT, scheduled_date TIMESTAMP, completed_date TIMESTAMP, status TEXT DEFAULT 'open', labor_cost DOUBLE PRECISION DEFAULT 0, parts_cost DOUBLE PRECISION DEFAULT 0, total_cost DOUBLE PRECISION DEFAULT 0, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, notes TEXT, created_at TIMESTAMP DEFAULT NOW());`;

  const dbs = [
    'nama_main_db', 'n11_db', 'n7_db', 'shippy_db',
    'ahmedalyamicompany_db', 'whatname_db', 'test_db_final',
    'brightstartradingco_db', 'leave_db', 'mgmg_db'
  ];

  for (const db of dbs) {
    console.log(`\n=== Creating tables in ${db} ===`);
    await ssh(`su - postgres -c "psql ${db} -c \\"${sql}\\""`);
  }

  console.log('\n=== All Done ===');
})();
