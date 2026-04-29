const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
cd /www/wwwroot/n11.namainvist.com

node -e "
const fs = require('fs');

// Check request-store.js structure  
const content = fs.readFileSync('./node_modules/next/dist/server/async-storage/request-store.js', 'utf8');
console.log('=== request-store (first 1500 chars) ===');
console.log(content.slice(0, 1500));

console.log('');
console.log('=== Searching for AsyncLocalStorage in request-store ===');
const idx = content.indexOf('AsyncLocalStorage');
if (idx > 0) console.log(content.slice(idx-100, idx+300));
"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
