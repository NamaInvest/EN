const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const localDaemon = path.join(__dirname, 'tenant_daemon.js');
const localContent = fs.readFileSync(localDaemon, 'utf8');

conn.on('ready', () => {
    console.log('--- CONNECTED. PUSHING ROOT SASS DAEMON TO HETZNER ---');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const remotePath = '/www/wwwroot/namainvist.com/tenant_daemon.js';
        
        const writeStream = sftp.createWriteStream(remotePath);
        writeStream.on('close', () => {
            console.log('✅ SFTP UPLOAD COMPLETE! SPAWNING PM2 BACKGROUND WORKER...');
            
            const bashScript = `
cd /www/wwwroot/namainvist.com
npm install @prisma/client
pm2 delete SaaS_Root_Daemon || true
pm2 start tenant_daemon.js --name "SaaS_Root_Daemon"
pm2 save
            `;
            
            conn.exec(bashScript, (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log('✅ HETZNER DAEMON DEPLOYMENT COMPLETE.');
                    conn.end();
                });
            });
        });
        
        writeStream.end(localContent);
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
