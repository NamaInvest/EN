const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec("sudo -u postgres psql -d n11_db -c \"DELETE FROM tenant_accounts WHERE subdomain='namainvest';\"", (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
