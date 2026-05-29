const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const cssPath = path.join(__dirname, 'src/app/globals.css');
const cssContent = fs.readFileSync(cssPath);

console.log('🚀 Connecting to N11 to fix Z-Index layout bug...');

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const remotePath = '/www/wwwroot/n11.namainvist.com/src/app/globals.css';
        
        sftp.writeFile(remotePath, cssContent, (err) => {
            if (err) throw err;
            console.log('✅ Uploaded globals.css successfully!');
            
            // Now run the Next.js build
            console.log('⏳ Triggering remote Next.js build...');
            conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
                if (err) throw err;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', (code) => {
                    console.log('🎉 Done! Exit code: ' + code);
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
