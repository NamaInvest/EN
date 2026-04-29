const { Client } = require('ssh2');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const conn = new Client();

console.log('--- EXPECTING PRE-ZIPPED src_bundle.zip ---');

conn.on('ready', () => {
    console.log('--- CONNECTED. PUSHING BUNDLE TO HETZNER ---');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const localZip = path.join(__dirname, 'src_bundle.zip');
        const remoteZip = '/www/wwwroot/namainvist.com/src_bundle.zip';
        
        const writeStream = sftp.createWriteStream(remoteZip);
        writeStream.on('close', () => {
            console.log('✅ SFTP UPLOAD COMPLETE! UNZIPPING AND BUILDING...');
            
            const bashScript = `
cd /www/wwwroot/namainvist.com
rm -rf src
unzip -o src_bundle.zip
rm src_bundle.zip
npm run build
pm2 restart nama-main
            `;
            
            conn.exec(bashScript, (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log('✅ HETZNER FULL UI/API DEPLOYMENT COMPLETE.');
                    conn.end();
                });
            });
        });
        
        fs.createReadStream(localZip).pipe(writeStream);
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
