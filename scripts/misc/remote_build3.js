const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d).stderr.on('data', d => out += d).on('close', (c) => {
            console.log(out.slice(-1000));
            console.log(`Done! Code: ${c}`);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
