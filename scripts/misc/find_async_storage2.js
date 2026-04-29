const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
cd /www/wwwroot/n11.namainvist.com

node -e "
// Try to find the correct module for reading request headers
const mods = [
    './node_modules/next/dist/server/async-storage/request-store',
    './node_modules/next/dist/server/async-storage/work-store',
    './node_modules/next/dist/server/app-render/work-unit-async-storage.external',
    './node_modules/next/dist/experimental/ppr',
];

for (const m of mods) {
    try {
        const mod = require(m);
        console.log('=== Module:', m, '===');
        console.log('keys:', JSON.stringify(Object.keys(mod)).slice(0,200));
    } catch(e) {
        console.log('Failed:', m, '->', e.message.slice(0,80));
    }
}

console.log('');
console.log('=== Checking work-store.js ===');
const fs = require('fs');
const content = fs.readFileSync('./node_modules/next/dist/server/async-storage/work-store.js', 'utf8');
console.log(content.slice(0, 500));
"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
