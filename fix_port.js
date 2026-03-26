const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- BINDING NAMA-MAIN TO PORT 2999 ---');
    
    const bashScript = `
#!/bin/bash
cd /www/wwwroot/namainvist.com
pm2 delete nama-main
pm2 start npm --name "nama-main" -- run start -- -p 2999
pm2 save
pm2 list
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('✅ NAMAINVIST.COM RESTORED ON PORT 2999.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
