const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/layout.tsx | grep "نظام نما انفست"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).catch?.(console.error);

conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
