const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- DEPLOYING AI-SEO METADATA TO N1 ---');
    
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        
        const filesToUpload = [
            { local: 'src/app/layout.tsx', remote: '/www/wwwroot/n1.namainvist.com/src/app/layout.tsx' },
            { local: 'src/app/page.tsx', remote: '/www/wwwroot/n1.namainvist.com/src/app/page.tsx' }
        ];
        
        const uploadPromises = filesToUpload.map(f => new Promise((resolve, reject) => {
            sftp.fastPut(f.local, f.remote, err => err ? reject(err) : resolve());
        }));
        
        Promise.all(uploadPromises).then(() => {
            console.log("✅ Smart Semantic Layout & WhatsApp UI Uploaded.");
            
            const cmd = `
                cd /www/wwwroot/n1.namainvist.com
                echo "1. Baking schemas and WhatsApp UI into Next.js DOM..."
                npm run build
                
                echo "2. Refreshing N1 Monolithic Engine..."
                pm2 restart n1 --update-env
                
                echo "✅ SEO & WHATSAPP INTEGRATION LIVE."
            `;
            
            conn.exec(cmd, (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
    });
}).on('error', (err) => {
    console.error('SSH Connection Failed:', err.message);
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
