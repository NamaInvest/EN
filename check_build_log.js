const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.exec('cat /www/wwwroot/n1.namainvist.com/build_log.txt', (err, s) => {
        let o = '';
        s.on('data', d => o += d.toString());
        s.on('close', () => {
            console.log("BUILD LOG:\n", o.slice(-1000));
            c.exec('pm2 status nama-main', (err2, s2) => {
                let o2 = '';
                s2.on('data', d => o2 += d.toString());
                s2.on('close', () => {
                    console.log("\nPM2 STATUS:\n", o2);
                    c.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
