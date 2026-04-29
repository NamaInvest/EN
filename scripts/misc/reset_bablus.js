const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
sudo -u postgres psql -h localhost -p 5432 -U postgres -d n11_db -c "DELETE FROM tenant_accounts WHERE subdomain='bablus';"
sudo -u postgres psql -h localhost -p 5432 -U postgres -c "DROP DATABASE bablus_db;" 2>/dev/null || echo 'DB already dropped'
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
