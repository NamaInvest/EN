const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
cd /www/wwwroot/n11.namainvist.com

echo "=== Find request-async-storage module ==="
find node_modules/next/dist -name "request-async-storage*" 2>/dev/null | head -10

echo ""
echo "=== List async-storage modules ==="
ls node_modules/next/dist/server/async-storage/ 2>/dev/null

echo ""
echo "=== Try reading headers from storage ==="
node -e "
try {
    const mod = require('./node_modules/next/dist/server/async-storage/request-async-storage.external.js');
    console.log('module:', Object.keys(mod));
} catch(e) { 
    console.log('Error 1:', e.message.slice(0,100));
}

try {
    const mod = require('./node_modules/next/dist/server/app-render/work-unit-async-storage.external.js');
    console.log('work-unit module:', typeof mod, Object.keys(mod||{}).slice(0,5));
} catch(e) { 
    console.log('Error 2:', e.message.slice(0,100));
}
"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
