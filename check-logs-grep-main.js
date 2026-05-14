const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const conn = new Client();
conn.on('ready', () => {
    conn.exec('grep "sso-redirect" /root/.pm2/logs/main-site-out.log /root/.pm2/logs/main-site-error.log | tail -n 50', (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('close', () => {
            console.log(output);
            conn.end();
        }).on('data', (data) => {
            output += data;
        }).stderr.on('data', (data) => {
            output += data;
        });
    });
}).connect(SERVER);
