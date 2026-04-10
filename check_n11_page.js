const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.exec('grep "خصم (ريال)" /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/sales/page.tsx', (err, s) => {
        let o = '';
        s.on('data', d => o += d.toString());
        s.on('close', () => {
            console.log("SERVER PAGE:\n", o);
            c.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
