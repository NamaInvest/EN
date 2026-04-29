const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const localPagePath = path.join(__dirname, 'src', 'app', 'page.tsx');
const localContent = fs.readFileSync(localPagePath, 'utf8');

conn.on('ready', () => {
    console.log('--- CONNECTED. PUSHING NEW UI TO HETZNER ---');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const remotePath = '/www/wwwroot/namainvist.com/src/app/page.tsx';
        
        const writeStream = sftp.createWriteStream(remotePath);
        writeStream.on('close', () => {
            console.log('✅ SFTP UPLOAD COMPLETE! TRIGGERING BUILD...');
            
            // Now run the build!
            const bashScript = `
cd /www/wwwroot/namainvist.com
npm run build
pm2 restart nama-main
            `;
            
            conn.exec(bashScript, (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log('✅ HETZNER REBUILD COMPLETE.');
                    conn.end();
                });
            });
        });
        
        writeStream.end(localContent);
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
