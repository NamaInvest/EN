const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.exec('pm2 logs nama-main --lines 50 --nostream', (err, s) => {
        let o = '';
        s.on('data', d => o += d.toString());
        s.on('close', () => {
            console.log("PM2 LOGS:\n", o);
            c.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
