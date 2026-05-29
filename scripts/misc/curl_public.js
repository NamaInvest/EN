const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- PUBLIC GATEWAY TEST ---');
    
    // Test the public URL to see the exact 502 headers
    const bashScript = `
#!/bin/bash
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
