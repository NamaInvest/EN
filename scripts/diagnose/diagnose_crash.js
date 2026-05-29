const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- FETCHING NAMA-MAIN CRASH LOGS ---');
    
    // Check why the Next.js app is giving 502
    const bashScript = `
#!/bin/bash
pm2 logs nama-main --lines 30 --nostream
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
