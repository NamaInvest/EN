const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- TRANSMITTING SECTOR DOMINATION LLMO TO ROOT DOMAIN ---');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const localPath = 'src/app/layout.tsx';
        const remotePath = '/www/wwwroot/namainvist.com/src/app/layout.tsx';
        
        sftp.fastPut(localPath, remotePath, (uploadErr) => {
            if (uploadErr) throw uploadErr;
            console.log("✅ Root Layout Patched with Sector Prompts!");
            
            // Also copy it to N1 so the sync catches it next time
            sftp.fastPut(localPath, '/www/wwwroot/n1.namainvist.com/src/app/layout.tsx', () => {});
            
            const cmd = `
                cd /www/wwwroot/namainvist.com
                npm run build
                pm2 reload all
            `;
            
            conn.exec(cmd, (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log('✅ SECTOR LLMO DEPLOYMENT COMPLETE.');
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
