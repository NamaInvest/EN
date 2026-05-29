const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { process.stdout.write(d); out += d; });
        stream.stderr.on('data', d => { process.stderr.write(d); out += d; });
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  // Check if tables exist
  console.log('=== Checking tables in brightstartradingco_db ===');
  await ssh("su - postgres -c \"psql brightstartradingco_db -c \\\"SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('work_shifts','vendor_ratings','fiscal_periods','service_tickets');\\\"\"");

  // Check DB user
  console.log('\n=== Checking DB roles ===');
  await ssh("su - postgres -c \"psql brightstartradingco_db -c \\\"SELECT current_user;\\\"\"");

  // Check table owner
  console.log('\n=== Table owners ===');
  await ssh("su - postgres -c \"psql brightstartradingco_db -c \\\"SELECT tablename, tableowner FROM pg_tables WHERE tablename IN ('work_shifts','vendor_ratings','fiscal_periods','service_tickets');\\\"\"");
})();
