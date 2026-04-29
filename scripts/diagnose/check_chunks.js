const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Check if built JS has our new labels (not minified away)
    conn.exec(`
        echo "=== Checking built chunks for 'Dashboard' label ===" &&
        grep -rl '"Dashboard"' /www/wwwroot/n2.namainvist.com/.next/static/chunks/ 2>/dev/null | head -3 &&
        echo "=== Checking built SSR chunks for Inventory labels ===" &&
        grep -rl "s\\.inventory" /www/wwwroot/n2.namainvist.com/.next/server/ 2>/dev/null | head -3 &&
        echo "=== Checking for PWA/SW config ===" &&
        find /www/wwwroot/n2.namainvist.com/ -name "sw.js" -o -name "service-worker.js" 2>/dev/null | head -5 &&
        echo "=== next.config.js PWA check ===" &&
        grep -i "pwa\|workbox\|service" /www/wwwroot/n2.namainvist.com/next.config.js 2>/dev/null | head -5
    `, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
