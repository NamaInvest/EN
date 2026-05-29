const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- SCANNING ALL FILES FOR /login ---');
    
    // Scan all files for /login matching
    const bashScript = `
#!/bin/bash
cd /www/wwwroot/namainvist.com
echo "=== GREP /login ==="
grep -rn "/login" src/
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
