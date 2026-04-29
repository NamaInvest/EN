const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const filesToUpload = [
    'src/app/api/admin/nodes/sync/route.ts'
];

conn.on('ready', () => {
    console.log('--- CONNECTED. PUSHING SYNC ENGINE FIX ---');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let uploaded = 0;
        
        const uploadNext = () => {
            if (uploaded >= filesToUpload.length) {
                console.log('✅ SYNC ENGINE INJECTION COMPLETE! RELOADING...');
                const bashScript = `
cd /www/wwwroot/namainvist.com
npm run build
pm2 reload nama-main
                `;
                conn.exec(bashScript, (execErr, stream) => {
                    if (execErr) throw execErr;
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => {
                        console.log('✅ HETZNER SYNC BUILD COMPLETE.');
                        conn.end();
                    });
                });
                return;
            }
            
            const relPath = filesToUpload[uploaded];
            const localFile = path.join(__dirname, relPath);
            const remoteFile = '/www/wwwroot/namainvist.com/' + relPath;
            const remoteDir = path.dirname(remoteFile);
            
            conn.exec('mkdir -p "' + remoteDir + '"', (dirErr) => {
                if(dirErr) console.warn(dirErr);
                sftp.fastPut(localFile, remoteFile, (putErr) => {
                    if (putErr) {
                        console.error('FAILED TO PUT: ', localFile, putErr);
                        conn.end();
                        return;
                    }
                    console.log('✅ Pushed: ' + relPath);
                    uploaded++;
                    uploadNext();
                });
            });
        };
        
        uploadNext();
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
