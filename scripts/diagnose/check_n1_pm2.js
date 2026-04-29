const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 logs nama-main --lines 100 --nostream', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end()).on('data', data => process.stdout.write(data)).stderr.on('data', data => process.stderr.write(data));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
