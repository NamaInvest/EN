const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
cd /www/wwwroot/n11.namainvist.com

node -e "
// Check how Next.js creates API request context
const fs = require('fs');

// Find route-module files that handle API routes
const withStore = fs.readFileSync('./node_modules/next/dist/server/async-storage/with-store.js', 'utf8');
console.log('=== with-store.js (first 2000 chars) ===');
console.log(withStore.slice(0, 2000));
"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
