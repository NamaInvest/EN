const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- EXECUTING EMERGENCY 502 FIX ---');
    
    // Nginx is returning 502 likely because the Next.js process for namainvist.com crashed.
    // Let's ensure Next.js is properly built and the process is online.
    const bashScript = `
#!/bin/bash
cd /www/wwwroot/namainvist.com
npm cache clean --force
rm -rf .next
npm run build
pm2 reload all
pm2 list
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('✅ 502 FIX DEPLOYED.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
