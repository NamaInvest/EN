const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- FETCHING NGINX VHOST PORT & PM2 PROCESS ---');
    
    const bashScript = `
#!/bin/bash
echo "=== NGINX CONFIG PORT ==="
cat /www/server/panel/vhost/nginx/namainvist.com.conf | grep proxy_pass || cat /etc/nginx/sites-enabled/namainvist.com* | grep proxy_pass

echo "=== PM2 PROCESS LIST ==="
pm2 list

echo "=== CHECKING PORT 3000 ==="
lsof -i :3000 || netstat -tlnp | grep 3000

echo "=== PM2 LOGS FOR ALL ==="
pm2 logs --lines 20 --err --nostream
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
