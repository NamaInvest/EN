const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('sudo -u postgres psql -h localhost -p 5432 -U postgres -d namafoundation_db -c "SELECT key, value, tenant_id FROM settings LIMIT 5;"', (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
});
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
