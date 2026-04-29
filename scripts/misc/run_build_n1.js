const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build', (err, stream) => {
        stream.on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d)).on('close', (c) => {
            console.log(`Exit code: ${c}`);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
