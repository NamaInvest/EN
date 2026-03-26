const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- NGINX SYNTAX TEST ---');
    
    // Run nginx -t to see why it won't start
    const bashScript = `
#!/bin/bash
nginx -t
cat /www/server/panel/vhost/nginx/node_n1.conf
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
