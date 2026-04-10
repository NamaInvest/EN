const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.exec('grep -r "Hindi" /www/wwwroot/n11.namainvist.com/.next/server/app/ 2>/dev/null | head -5', (err, s) => {
        let o = '';
        s.on('data', d => o += d.toString());
        s.on('close', () => {
            console.log("Found Hindi in Server Build:\n", o);
            c.exec('grep -r "Hindi" /www/wwwroot/n11.namainvist.com/.next/static/chunks/ 2>/dev/null | head -5', (err2, s2) => {
                let o2 = '';
                s2.on('data', d => o2 += d.toString());
                s2.on('close', () => {
                    console.log("Found Hindi in Client Build:\n", o2);
                    c.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
