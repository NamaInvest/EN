const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- HARD RESTARTING NGINX ---');
    
    // Nginx reload failed earlier, which means it's still looking at 3000 in memory.
    const bashScript = `
#!/bin/bash
/etc/init.d/nginx restart || systemctl restart nginx
sleep 2
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
