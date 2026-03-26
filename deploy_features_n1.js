const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- DEPLOYING AI KNOWLEDGE BASE (/features) TO N1 ---');
    
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        
        const localPath = 'src/app/features/page.tsx';
        const remoteDir = '/www/wwwroot/n1.namainvist.com/src/app/features';
        const remotePath = remoteDir + '/page.tsx';
        
        const executeDeploy = () => {
            sftp.fastPut(localPath, remotePath, (uploadErr) => {
                if (uploadErr) {
                    console.error("Upload failed", uploadErr);
                    return conn.end();
                }
                console.log("✅ Features Knowledge Base Uploaded.");
                
                const cmd = `
                    cd /www/wwwroot/n1.namainvist.com
                    echo "1. Baking features page into HTML for AI Crawlers..."
                    npm run build
                    
                    echo "2. Refreshing N1 Monolithic Engine..."
                    pm2 restart n1 --update-env
                    
                    echo "✅ SEO KNOWLEDGE BASE LIVE."
                `;
                
                conn.exec(cmd, (execErr, stream) => {
                    if (execErr) throw execErr;
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => conn.end());
                });
            });
        };

        // Create remote directory first just in case
        conn.exec(`mkdir -p ${remoteDir}`, (err, stream) => {
            if (err) throw err;
            stream.on('close', executeDeploy);
        });

    });
}).on('error', (err) => {
    console.error('SSH Connection Failed:', err.message);
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
