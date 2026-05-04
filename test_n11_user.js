const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('PGPASSWORD="n11_pass123" psql -h localhost -U n11_db -d ahmedalyamicompany_db -c "SELECT count(*) FROM \\"FixedAsset\\";"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
