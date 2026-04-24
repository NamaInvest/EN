const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const conn = new Client();
const APP = '/www/wwwroot/namainvist.com';

const filesToUpload = [
  'src/app/(dashboard)/barcode/page.tsx',
  'src/app/(dashboard)/price-quotes/page.tsx',
  'src/app/(dashboard)/warehouses/options/page.tsx',
  'src/app/page.tsx',
  'src/app/_module-filter.tsx',
  'src/components/ThemeSwitcher.tsx',
  'src/components/Toast.tsx',
  'src/app/(dashboard)/sales/options/page.tsx' // Background UI fix
];

conn.on('ready', () => {
    console.log('Client ready. Deploying Mojibake fixes...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let pending = filesToUpload.length;
        if (pending === 0) {
            rebuildAndRestart();
            return;
        }

        filesToUpload.forEach(file => {
            const localPath = path.join(__dirname, file);
            const remotePath = `${APP}/${file}`;
            sftp.fastPut(localPath, remotePath, (err) => {
                if (err) console.error(`Failed to upload ${file}:`, err);
                else console.log(`✅ Uploaded: ${file}`);
                
                pending--;
                if (pending === 0) {
                    console.log('All files uploaded. Rebuilding...');
                    rebuildAndRestart();
                }
            });
        });

        function rebuildAndRestart() {
            conn.exec(`cd ${APP} && npm run build && pm2 restart main-site`, (err, stream) => {
                if (err) throw err;
                stream.on('close', (code, signal) => {
                    console.log('Deploy complete. Connection closed.');
                    conn.end();
                }).on('data', (data) => {
                    process.stdout.write(data);
                }).stderr.on('data', (data) => {
                    process.stderr.write(data);
                });
            });
        }
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
