const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('md5sum /root/sidebars_v2/*', (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
