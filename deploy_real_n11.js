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

const basePath = '/www/wwwroot/n11.namainvist.com/';

const filesToUpload = [
    'src/app/(dashboard)/sales/page.tsx',
    'src/app/(dashboard)/sales/options/page.tsx',
    'src/app/api/auth/login/route.ts',
    'src/middleware.ts',
    'src/components/Sidebar.tsx',
    'src/components/SessionGuard.tsx',
    'src/components/InactivityGuard.tsx',
    'src/lib/qz.ts',
    'src/app/(dashboard)/reports/73-modules/page.tsx',
    'src/lib/auth.ts',
    'src/app/api/sales/route.ts',
    'src/app/api/categories/route.ts',
    'src/app/(dashboard)/products/page.tsx',
    'src/app/(dashboard)/layout.tsx',
    'src/app/(dashboard)/settings/page.tsx',
    'src/app/api/system/reset/route.ts'
];

console.log('🔄 Connecting to N11 Production Server (46.4.188.170)...');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected successfully to N11!');
    
    conn.exec('mkdir -p /www/wwwroot/n11.namainvist.com/src/app/api/auth/login /www/wwwroot/n11.namainvist.com/src/components /www/wwwroot/n11.namainvist.com/src/lib /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/reports/73-modules /www/wwwroot/n11.namainvist.com/src/app/api/sales /www/wwwroot/n11.namainvist.com/src/app/api/categories /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/products /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/settings /www/wwwroot/n11.namainvist.com/src/app/api/system/reset', (err, stream) => {
        if (err) throw err;
        
        // Consume stream to prevent hang
        stream.on('data', () => {});
        stream.stderr.on('data', () => {});
        
        stream.on('close', () => {
            console.log('📁 Remote directories are ready.');
            conn.sftp((err, sftp) => {
                if (err) throw err;
                
                let uploaded = 0;
                let uploadCount = 0;
                filesToUpload.forEach(relPath => {
                    const localFile = path.join(__dirname, relPath);
                    if (!fs.existsSync(localFile)) {
                        console.error('âڑ ï¸ڈ File not found locally:', localFile);
                        uploaded++;
                        return;
                    }
                    uploadCount++;
                    const remoteFile = basePath + relPath.replace(/\\/g, '/');
                    
                    sftp.fastPut(localFile, remoteFile, (err) => {
                        if (err) {
                            console.error(`❌ Error uploading ${relPath}`, err);
                        } else {
                            console.log(`✅ Uploaded: ${relPath}`);
                        }
                        uploaded++;
                        
                        if (uploaded === filesToUpload.length) {
                            console.log('⏳ Starting remote build & NextJS restart on N11...');
                            conn.exec('cd /www/wwwroot/n11.namainvist.com && rm -rf .next && rm -f src/proxy.ts && npm install qz-tray && npm run build && pm2 restart n11', (err, stream) => {
                                if (err) throw err;
                                stream.on('close', (code, signal) => {
                                    console.log('🚀 N11 Deployment completed successfully!');
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

