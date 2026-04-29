const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Next.js version ==="
cd /www/wwwroot/n11.namainvist.com && node -e "const p=require('./node_modules/next/package.json'); console.log('next:', p.version)"

echo ""
echo "=== Testing headers() behavior ==="
node -e "
const { AsyncLocalStorage } = require('async_hooks');

// Simulate what Next.js does
try {
    const nextHeaders = require('/www/wwwroot/n11.namainvist.com/node_modules/next/dist/server/request/headers');
    console.log('headers module keys:', Object.keys(nextHeaders).slice(0,5));
} catch(e) {
    console.log('Cannot load next/headers directly:', e.message.slice(0,100));
}
"

echo ""
echo "=== Test: does x-tenant reach API route? ==="
# Create a test endpoint that prints all headers
node -e "
const http = require('http');
const req = http.request({
    hostname: '127.0.0.1',
    port: 3500,
    path: '/api/health',
    method: 'GET',
    headers: {
        'Host': 'namainvest.namainvist.com',
        'x-tenant': 'namainvest'
    }
}, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response x-tenant header:', res.headers['x-tenant'] || 'NOT in response');
    });
});
req.end();
"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
