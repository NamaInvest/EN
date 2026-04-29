const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec("sudo -u n11_db psql -c 'CREATE DATABASE test_create_db;'", (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
