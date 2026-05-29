const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Fetch the actual page with HTTPS to trigger proper SSR
    conn.exec(`
        echo "=== HTTPS FETCH ===" &&
        curl -sk "https://n2.namainvist.com/dashboard" -H "Cookie: token=dummy" 2>/dev/null | grep -o "طلبات الشراء[^<\"]*" | head -3 &&
        echo "===" &&
        curl -sk "https://n2.namainvist.com/dashboard" -H "Cookie: token=dummy" 2>/dev/null | grep -o "Purchase[^<\"]*" | head -3 &&
        echo "=== RAW RESPONSE FROM PORT 3002 ===" &&
        curl -s "http://127.0.0.1:3002/api/health" 2>/dev/null | head -100 &&
        echo "=== N2 ACTUAL VERSION CHECK ===" &&
        grep -oa '"version":"[^"]*"' /www/wwwroot/n2.namainvist.com/package.json 2>/dev/null | head -2
    `, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
