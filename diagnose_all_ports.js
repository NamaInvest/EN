const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- SCANNING ALL NGINX AND PM2 PORTS ---');
    
    const bashScript = `
#!/bin/bash
echo "=== LISTENING NODE PORTS ==="
netstat -tlnp | grep node

echo "=== PM2 LIST ==="
pm2 list

echo "=== NGINX REVERSE PROXY CONFIGS ==="
grep -E "server_name *.namainvist.com|proxy_pass" /www/server/panel/vhost/nginx/*.conf | grep -v 'localhost'

echo "=== LOGS OF NAMA-MAIN ==="
pm2 logs nama-main --lines 20 --nostream
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
