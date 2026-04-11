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
    'src/lib/qz.ts'
];

console.log('ًں”„ ط¬ط§ط±ظٹ ط§ظ„ط§طھطµط§ظ„ ط¨ط®ط§ط¯ظ… N11 ط§ظ„ط­ظ‚ظٹظ‚ظٹ (46.4.188.170)...');

const conn = new Client();
conn.on('ready', () => {
    console.log('âœ… طھظ… ط§ظ„ط§طھطµط§ظ„ ط¨ظ†ط¬ط§ط­!');
    
    conn.exec('mkdir -p /www/wwwroot/n11.namainvist.com/src/app/api/auth/login /www/wwwroot/n11.namainvist.com/src/components /www/wwwroot/n11.namainvist.com/src/lib', (err, stream) => {
        if (err) throw err;
        
        // Consume stream to prevent hang
        stream.on('data', () => {});
        stream.stderr.on('data', () => {});
        
        stream.on('close', () => {
            console.log('ًں“پ طھظ… طھط¬ظ‡ظٹط² ط§ظ„ظ…ط¬ظ„ط¯ط§طھ.');
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
                            console.error(`â‌Œ ط®ط·ط£ ظپظٹ ط±ظپط¹ ${relPath}`, err);
                        } else {
                            console.log(`âœ… طھظ… ط±ظپط¹ ${relPath}`);
                        }
                        uploaded++;
                        
                        if (uploaded === filesToUpload.length) {
                            console.log('âڈ³ ط¬ط§ط±ظٹ طھط­ط¯ظٹط« ط§ظ„طھط·ط¨ظٹظ‚ (ط­ط°ظپ ProxyطŒ ط¨ظ†ط§ط،طŒ ط¥ط¹ط§ط¯ط© طھط´ط؛ظٹظ„)...');
                            conn.exec('cd /www/wwwroot/n11.namainvist.com && rm -f src/proxy.ts && npm install qz-tray && npm run build && pm2 restart n11', (err, stream) => {
                                if (err) throw err;
                                stream.on('close', (code, signal) => {
                                    console.log('ًںڑ€ طھظ…طھ ط¹ظ…ظ„ظٹط© ط§ظ„طھط­ط¯ظٹط« ظˆط§ظ„ط¨ظ†ط§ط، ط¨ظ†ط¬ط§ط­ ظ…ط¯ظˆظٹ ط¹ظ„ظ‰ N11!');
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
    console.error('â‌Œ ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„:', err);
}).connect(config);

