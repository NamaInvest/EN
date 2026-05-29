const { Client } = require('ssh2');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /www/wwwroot/namainvist.com/src/app/layout.tsx | grep -i "pricing"', (err, stream) => {
        stream.on('data', d => console.log('' + d)).on('close', () => conn.end());
    });
}).connect(SERVER);
