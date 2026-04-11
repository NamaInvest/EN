const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const conn = new Client();
conn.on('ready', () => {
    conn.exec('grep -A 5 -B 5 "handleDeleteAllCategories" /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/products/page.tsx || echo "NOT_FOUND"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect(config);
