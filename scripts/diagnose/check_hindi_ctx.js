const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    // Check 313cc35d9049817d.js for what it contains regarding Hindi
    c.exec("grep -o '.\\{30\\}Hindi.\\{30\\}' /www/wwwroot/n11.namainvist.com/.next/static/chunks/313cc35d9049817d.js 2>/dev/null | head -5", (err, s) => {
        let o = '';
        s.on('data', d => { o += d.toString(); });
        s.on('close', () => {
            console.log('313cc chunk Hindi context:', o.trim());
            c.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
