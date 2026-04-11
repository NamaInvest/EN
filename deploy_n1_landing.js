const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

const basePath = '/www/wwwroot/n1.namainvist.com/';

const filesToUpload = [
    'src/app/page.tsx'
];

console.log('🔄 Deploying page.tsx to N1 (nama-main)...');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected successfully!');
    
    conn.exec('mkdir -p /www/wwwroot/n1.namainvist.com/src/app', (err, stream) => {
        if (err) throw err;
        
        stream.on('data', () => {});
        stream.stderr.on('data', () => {});
        
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                if (err) throw err;
                
                let uploaded = 0;
                filesToUpload.forEach(relPath => {
                    const localFile = path.join(__dirname, relPath);
                    if (!fs.existsSync(localFile)) {
                        console.error('⚠️ File not found locally:', localFile);
                        uploaded++;
                        return;
                    }
                    const remoteFile = basePath + relPath.replace(/\\/g, '/');
                    
                    sftp.fastPut(localFile, remoteFile, (err) => {
                        if (err) {
                            console.error(`❌ Error uploading ${relPath}`, err);
                        } else {
                            console.log(`✅ Uploaded: ${relPath}`);
                        }
                        uploaded++;
                        
                        if (uploaded === filesToUpload.length) {
                            console.log('⏳ Starting remote build on N1...');
                            conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart nama-main', (err, stream) => {
                                if (err) throw err;
                                stream.on('close', (code, signal) => {
                                    console.log('🚀 N1 Landing Deploy completed successfully!');
                                    conn.end();
                                }).on('data', (data) => process.stdout.write(data.toString()))
                                  .stderr.on('data', (data) => process.stderr.write(data.toString()));
                            });
                        }
                    });
                });
            });
        });
    });
}).on('error', (err) => {
    console.error('❌ Connection Error:', err);
}).connect(config);
