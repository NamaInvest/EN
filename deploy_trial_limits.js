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

// We must deploy Trial logics to N1 (The Clone Master Template)
const basePathN1 = '/www/wwwroot/n1.namainvist.com/';

const filesN1 = [
    'src/app/api/sales/route.ts',
    'src/app/api/tenant/trial-status/route.ts',
    'src/components/TrialBanner.tsx',
    'src/app/(dashboard)/layout.tsx'
];

// We must ALSO deploy the orchestrator fix to namainvist.com (Landing Page Server)
const basePathMain = '/www/wwwroot/namainvist.com/';
const filesMain = [
    'src/app/api/tenant/provision/route.ts'
];

console.log('🔄 Connecting to Production Server...');

const conn = new Client();
conn.on('ready', () => {

    // First deploy to N1
    conn.exec('mkdir -p /www/wwwroot/n1.namainvist.com/src/app/api/tenant/trial-status', (err) => {
        conn.sftp((err, sftp) => {
            let uploaded = 0;
            const totalFiles = filesN1.length + filesMain.length;

            const onUploadComplete = () => {
                uploaded++;
                if (uploaded === totalFiles) {
                    console.log('⏳ Rebuilding N1 Node...');
                    conn.exec('nohup bash -c "cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1" > /www/wwwroot/n1.namainvist.com/build.log 2>&1 &', () => {
                        console.log('⏳ Rebuilding Main Node...');
                        conn.exec('nohup bash -c "cd /www/wwwroot/namainvist.com && npm run build && pm2 restart namainvist" > /www/wwwroot/namainvist.com/build.log 2>&1 &', () => {
                            setTimeout(() => {
                                console.log('🚀 Deployments triggered! Rebuilding N1 & Main Landing...');
                                conn.end();
                            }, 1000);
                        });
                    });
                }
            };

            filesN1.forEach(relPath => {
                sftp.fastPut(path.join(__dirname, relPath), basePathN1 + relPath.replace(/\\/g, '/'), (err) => {
                    if (err) console.error(`Error N1 ${relPath}`, err); else console.log(`✅ Uploaded to N1: ${relPath}`);
                    onUploadComplete();
                });
            });

            filesMain.forEach(relPath => {
                sftp.fastPut(path.join(__dirname, relPath), basePathMain + relPath.replace(/\\/g, '/'), (err) => {
                    if (err) console.error(`Error Main ${relPath}`, err); else console.log(`✅ Uploaded to Main: ${relPath}`);
                    onUploadComplete();
                });
            });

        });
    });

}).connect(config);
