const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /root/.pm2/logs/n2-error.log | tail -n 50', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            conn.exec('cat /root/.pm2/logs/n2-out.log | tail -n 50', (err, stream2) => {
                stream2.on('data', d => process.stdout.write(d.toString()));
                stream2.stderr.on('data', d => process.stderr.write(d.toString()));
                stream2.on('close', () => conn.end());
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
