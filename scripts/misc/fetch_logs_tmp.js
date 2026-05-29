const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ متصل بالخادم...');
    conn.exec('pm2 logs main-site --lines 50 --nostream', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000
});
