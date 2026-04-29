const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- PINGING NAMAINVIST.COM ---');
    
    // Check if the domain resolves to Cloudflare (104.x or 172.x) or Hetzner (46.x)
    const bashScript = `
#!/bin/bash
ping -c 1 namainvist.com
curl -vI --resolve namainvist.com:443:127.0.0.1 https://namainvist.com -k
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
