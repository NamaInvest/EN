const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const basePath = '/www/wwwroot/n11.namainvist.com/';

const files = [
    'src/app/api/system/reset/route.ts'
];

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to Fleet Server.');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let uploads = Promise.resolve();
        files.forEach(file => {
            uploads = uploads.then(() => {
                return new Promise((resolve, reject) => {
                    const localPath = path.join(__dirname, file);
                    const remotePath = basePath + file.replace(/\\/g, '/');
                    
                    sftp.fastPut(localPath, remotePath, (err) => {
                        if (err) {
                            console.error('Upload Failed:', file, err);
                            reject(err);
                        } else {
                            console.log('Uploaded successfully:', file);
                            resolve();
                        }
                    });
                });
            });
        });

        uploads.then(() => {
            console.log('Building Next.js on N11...');
            conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
                if (err) throw err;
                stream.on('close', (code, signal) => {
                    console.log('Build & Restart Complete! Exiting.');
                    conn.end();
                }).on('data', (data) => {
                    console.log('STDOUT: ' + data);
                }).stderr.on('data', (data) => {
                    console.log('STDERR: ' + data);
                });
            });
        }).catch(() => conn.end());
    });
}).connect(config);
