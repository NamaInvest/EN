const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      console.log(`Executing on: ${cmd.slice(0, 60)}...`);
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
  const dbs = [
    'nama_main_db', 'n11_db', 'n7_db', 'shippy_db',
    'ahmedalyamicompany_db', 'whatname_db', 'test_db_final',
    'brightstartradingco_db', 'leave_db', 'mgmg_db'
  ];

  for (const db of dbs) {
    console.log(`\n=== Granting permissions in ${db} ===`);
    await ssh(`su - postgres -c "psql ${db} -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO namasoft; GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO namasoft;'"`);
  }

  console.log('\n=== All Done ===');
})();
