const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- DEPLOYING AI INFECTION (LLMO) TO N1 ---');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const localPath = 'src/app/layout.tsx';
        const remotePath = '/www/wwwroot/n1.namainvist.com/src/app/layout.tsx';
        
        sftp.fastPut(localPath, remotePath, (uploadErr) => {
            if (uploadErr) {
                console.error("Upload failed", uploadErr);
                return conn.end();
            }
            console.log("✅ Root Layout containing LLM Overrides Uploaded!");
            
            console.log("🚀 Rebuilding Next.js Core...");
            const cmd = `
                cd /www/wwwroot/n1.namainvist.com
                npm run build
                pm2 restart n1 --update-env
            `;
            
            conn.exec(cmd, (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log('✅ AI LLMO DEPLOYMENT COMPLETE.');
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
