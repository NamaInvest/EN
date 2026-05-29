const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- EXECUTING INTERNAL CURL TEST ON 2999 ---');
    
    const bashScript = `
#!/bin/bash
echo "=== CURL TEST 2999 ==="
curl -vI --max-time 10 http://127.0.0.1:2999

echo "=== CHECKING PM2 PROCESS LOGS ==="
pm2 logs nama-main --lines 20 --nostream

echo "=== RESTARTING NGINX PROPERLY ==="
systemctl restart nginx || /etc/init.d/nginx restart
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
