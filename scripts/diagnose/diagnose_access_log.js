const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- FETCHING NGINX ACCESS LOGS ---');
    
    const bashScript = `
#!/bin/bash
echo "=== NGINX ACCESS LOG ==="
tail -n 15 /www/wwwlogs/namainvist.com.log
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
