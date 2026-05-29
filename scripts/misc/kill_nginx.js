const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- PURGING ZOMBIE NGINX INSTANCES ---');
    
    // Killall overrides AaPanel's failing control process
    const bashScript = `
#!/bin/bash
echo "Killing all nginx processes..."
killall -9 nginx
sleep 2

echo "Starting Nginx cleanly..."
/etc/init.d/nginx start

echo "Verifying Public Website..."
curl -vI https://namainvist.com
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
