const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cd /www/wwwroot/n2.namainvist.com && npm run build 2>&1 | grep -B2 "prerender\\|digest\\|at j\\|chunk" | head -30`, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
