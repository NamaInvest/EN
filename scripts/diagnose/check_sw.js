const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('cat /www/wwwroot/n11.namainvist.com/public/sw.js 2>/dev/null', (err, s) => {
        let o = '';
        s.on('data', d => o += d.toString());
        s.on('close', () => {
            console.log("SW Config:\n", o.slice(0, 1000));
            c.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
