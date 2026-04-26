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
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

(async () => {
  // Map of tenant databases to their actual DB users
  // Discovered from .env files on the server
  const tenantMap = [
    { db: 'n11_db', user: 'n11_db' },         // n11.namainvist.com
    { db: 'n7_db', user: 'postgres' },          // n7.namainvist.com (uses postgres directly)
    { db: 'nama_main_db', user: 'postgres' },   // main site
    { db: 'shippy_db', user: 'postgres' },
    { db: 'ahmedalyamicompany_db', user: 'ahmedalyamicompany_db' },
    { db: 'whatname_db', user: 'whatname_db' },
    { db: 'test_db_final', user: 'postgres' },
    { db: 'brightstartradingco_db', user: 'brightstartradingco_db' },
    { db: 'leave_db', user: 'leave_db' },
    { db: 'mgmg_db', user: 'mgmg_db' },
  ];

  const grantSQL = "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %USER%; GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %USER%;";

  for (const t of tenantMap) {
    if (t.user === 'postgres') {
      console.log(`⏭️  ${t.db} — uses postgres (already owner) — skip`);
      continue;
    }
    console.log(`🔑 Granting on ${t.db} to ${t.user}...`);
    const sql = grantSQL.replace(/%USER%/g, t.user);
    const result = await ssh(`su - postgres -c "psql ${t.db} -c '${sql}'" 2>&1`);
    if (result.includes('ERROR') && result.includes('does not exist')) {
      console.log(`   ⚠️ Role ${t.user} doesn't exist — trying to create...`);
      await ssh(`su - postgres -c "psql -c 'CREATE ROLE ${t.user} WITH LOGIN PASSWORD $$pass123$$;'"`);
      await ssh(`su - postgres -c "psql ${t.db} -c '${sql}'"`);
      console.log(`   ✅ Created and granted`);
    } else if (result.includes('GRANT')) {
      console.log(`   ✅ Done`);
    } else {
      console.log(`   ❌ ${result.slice(0, 100)}`);
    }
  }

  console.log('\n=== All Done ===');
})();
