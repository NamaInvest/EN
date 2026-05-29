const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- REBUILDING AND RESTARTING NAMA-MAIN ---');
    
    // Nginx is returning 502 likely because the Next.js process for namainvist.com crashed.
    const bashScript = `
#!/bin/bash
cd /www/wwwroot/namainvist.com
npm run build
pm2 restart nama-main
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('✅ NEXT.JS REBUILT AND RESTARTED.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
