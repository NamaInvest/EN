const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- FORCING MAIN WEBSITE START ---');
    
    const bashScript = `
#!/bin/bash
cd /www/wwwroot/namainvist.com
# Delete any existing process that might be hanging
pm2 delete nama-main
pm2 start npm --name "nama-main" -- run start -- -p 3000
pm2 save
pm2 list
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('✅ FORCED PM2 START ON PORT 3000.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
