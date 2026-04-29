const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const filesToUpload = [
  { local: 'src/app/page.tsx', remote: '/www/wwwroot/namainvist.com/src/app/page.tsx' },
  { local: 'src/app/login/page.tsx', remote: '/www/wwwroot/namainvist.com/src/app/login/page.tsx' },
  { local: 'src/app/onboarding/zatca/page.tsx', remote: '/www/wwwroot/namainvist.com/src/app/onboarding/zatca/page.tsx' }
];

conn.on('ready', () => {
    console.log('--- DEPLOYING SSO & UI UPDATES TO HETZNER ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let uploaded = 0;
        
        filesToUpload.forEach(f => {
            sftp.fastPut(path.join(__dirname, f.local), f.remote, (err) => {
                if(err) {
                    console.error('Failed to upload', f.local, err);
                    return;
                }
                console.log('Uploaded:', f.local);
                uploaded++;
                if (uploaded === filesToUpload.length) {
                    // All files uploaded, execute build
                    const bashScript = `
cd /www/wwwroot/namainvist.com
npm run build
pm2 reload nama-main
                    `;
                    conn.exec(bashScript, (execErr, stream) => {
                        if(execErr) throw execErr;
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream.on('close', () => {
                            console.log('✅ SSO Route & UI Updates are live on Port 2999.');
                            conn.end();
                        });
                    });
                }
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
