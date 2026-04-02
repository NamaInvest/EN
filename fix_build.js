const { Client } = require('ssh2');
const conn = new Client();
const BASE = '/www/wwwroot/n3.namainvist.com';
conn.on('ready', () => {
    const cmd = `cd ${BASE} && \\
rm -rf src/app/test-i18n && \\
npm run build 2>&1 | tail -6 && \\
pm2 restart n3`;
    conn.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
