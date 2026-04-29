const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- FETCHING NGINX ERRORS ---');
    
    const bashScript = `
#!/bin/bash
echo "=== NGINX ERROR LOG ==="
tail -n 20 /www/wwwlogs/namainvist.com.error.log || tail -n 20 /www/server/panel/vhost/logs/namainvist.com.error.log || echo "No logs found."

echo "=== FULL VHOST CONFIG ==="
cat /www/server/panel/vhost/nginx/namainvist.com.conf
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
