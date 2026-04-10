const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.exec('pm2 logs nama-main --lines 20 --nostream', (err, s) => {
        let o = '';
        s.on('data', d => o += d.toString());
        s.on('close', () => {
            console.log("NAMA-MAIN LOGS:\n", o);
            c.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
