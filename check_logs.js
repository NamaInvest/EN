const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected! Fetching PM2 status and logs...');
    
    conn.exec('pm2 list && pm2 logs main-site --lines 10 --nostream', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            console.log(data.toString());
        }).stderr.on('data', (data) => {
            console.error(data.toString());
        });
    });
}).connect(SERVER);
