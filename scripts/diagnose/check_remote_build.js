const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const conn = new Client();

conn.on('ready', () => {
    conn.exec('tail -n 50 /tmp/deploy_n1_full.log', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({ host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b', keepaliveInterval: 10000 });
