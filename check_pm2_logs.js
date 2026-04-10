const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.exec('pm2 logs nama-main --lines 50', (err, s) => {
        let o = '';
        s.on('data', d => o += d.toString());
        s.on('close', () => {
            console.log("PM2 LOGS:\n", o);
            c.exec('pm2 info nama-main', (err2, s2) => {
                let o2 = '';
                s2.on('data', d => o2 += d.toString());
                s2.on('close', () => {
                    console.log("\nPM2 INFO:\n", o2);
                    c.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
