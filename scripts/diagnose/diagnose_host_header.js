const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- FETCHING HOST HEADER SIMULATION ---');
    
    // Simulate a request from Nginx with the public Host header
    const bashScript = `
#!/bin/bash
echo "=== CURL WITH HOST: namainvist.com ==="
curl -vI -H "Host: namainvist.com" http://127.0.0.1:2999

echo "=== CHECKING PM2 STATUS AGAIN ==="
pm2 list
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
