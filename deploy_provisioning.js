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

const basePath = '/www/wwwroot/namainvist.com/';

const filesToUpload = [
    'next.config.ts',
    'src/components/GlobalAuthGuard.tsx',
    'src/app/api/tenant/provision/route.ts',
    'src/app/onboarding/provisioning/page.tsx',
    'src/app/api/auth/sync/route.ts'
];

console.log('🔄 Connecting to Production Server...');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('mkdir -p /www/wwwroot/namainvist.com/src/app/onboarding/provisioning /www/wwwroot/namainvist.com/src/app/api/tenant/provision /www/wwwroot/namainvist.com/src/app/api/auth/sync', (err) => {
        if (err) throw err;
        conn.sftp((err, sftp) => {
            if (err) throw err;
            let uploaded = 0;
            filesToUpload.forEach(relPath => {
                const localFile = path.join(__dirname, relPath);
                const remoteFile = basePath + relPath.replace(/\\/g, '/');
                sftp.fastPut(localFile, remoteFile, (err) => {
                    if (err) console.error(`❌ Error uploading ${relPath}`, err);
                    else console.log(`✅ Uploaded: ${relPath}`);
                    uploaded++;
                    
                    if (uploaded === filesToUpload.length) {
                        console.log('⏳ Rebuilding Landing Site (Master Node) in background...');
                        conn.exec('nohup bash -c "cd /www/wwwroot/namainvist.com && npm run build && pm2 restart namainvist || pm2 restart default" > /www/wwwroot/namainvist.com/build.log 2>&1 &', (err, stream) => {
                            if (err) throw err;
                            // Add small delay to ensure SSH sends the command before closing
                            setTimeout(() => {
                                console.log('🚀 Deployment to Master triggered in background! Logs at /www/wwwroot/namainvist.com/build.log');
                                conn.end();
                            }, 1000);
                        });
                    }
                });
            });
        });
    });
}).connect(config);
