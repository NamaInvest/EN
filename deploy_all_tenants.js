const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const conn = new Client();
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
    console.log('Client ready. Fetching all tenant folders...');
    conn.exec('ls -d /www/wwwroot/*.namainvist.com /www/wwwroot/namainvist.com', (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', data => output += data.toString());
        stream.on('close', () => {
            const folders = output.split('\n').map(s => s.trim()).filter(s => s);
            console.log('Found folders:', folders);
            
            conn.sftp((err, sftp) => {
                if (err) throw err;
                let currentFolderIdx = 0;

                function processNextFolder() {
                    if (currentFolderIdx >= folders.length) {
                        console.log('ALL TENANTS DEPLOYED!');
                        conn.end();
                        return;
                    }
                    const folder = folders[currentFolderIdx++];
                    console.log(`\n--- Deploying to ${folder} ---`);
                    
                    let pending = filesToUpload.length;
                    filesToUpload.forEach(file => {
                        const localPath = path.join(__dirname, file);
                        const remotePath = `${folder}/${file}`;
                        sftp.fastPut(localPath, remotePath, (err) => {
                            if (err) console.error(`Failed to upload ${file} to ${folder}:`, err);
                            else console.log(`✅ Uploaded: ${file}`);
                            
                            pending--;
                            if (pending === 0) {
                                console.log(`Rebuilding ${folder}...`);
                                
                                // PM2 name is usually the subdomain, except for namainvist.com which is main-site
                                let pm2Name = 'main-site';
                                if (folder.includes('n1.namainvist.com')) pm2Name = 'n1-main';
                                else if (folder !== '/www/wwwroot/namainvist.com') {
                                    pm2Name = path.basename(folder).split('.')[0];
                                }
                                
                                conn.exec(`cd ${folder} && npm run build && pm2 restart ${pm2Name}`, (err, stream) => {
                                    if (err) throw err;
                                    stream.on('data', d => process.stdout.write(d));
                                    stream.on('close', () => {
                                        console.log(`Done building ${folder}`);
                                        processNextFolder();
                                    });
                                });
                            }
                        });
                    });
                }
                processNextFolder();
            });
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
