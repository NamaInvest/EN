const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.exec('cat /www/server/panel/vhost/openlitespeed/detail/n11.namainvist.com.conf', (err, s) => {
        let o = '';
        s.on('data', d => o += d.toString());
        s.on('close', () => {
            console.log("Detail Config:\n", o);
            c.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
