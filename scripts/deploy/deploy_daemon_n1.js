const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- DEPLOYING BUSINESS AUTOMATION (Sales/Purchases) TO N1 ---');
    
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        
        const localPath = 'automation_daemon.js';
        const remotePath = '/www/wwwroot/n1.namainvist.com/automation_daemon.js';
        
        sftp.fastPut(localPath, remotePath, (uploadErr) => {
            if (uploadErr) {
                console.error("Upload failed", uploadErr);
                return conn.end();
            }
            console.log("✅ New daemon logic uploaded.");
            
            const cmd = `
                cd /www/wwwroot/n1.namainvist.com
                echo "1. Terminating legacy Cron workers..."
                pm2 delete automation_daemon 2>/dev/null || true
                
                echo "2. Bootstrapping new full-suite Automation Daemon..."
                pm2 start automation_daemon.js --name "automation_daemon"
                
                echo "3. Saving PM2 snapshot for auto-reboot..."
                pm2 save
                
                echo "✅ AUTOMATION SEQUENCE ACTIVE."
            `;
            
            conn.exec(cmd, (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
