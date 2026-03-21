const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const localPath = 'd:\\namasoft9-3-main\\src\\app\\api\\purchases\\ocr\\route.ts';
const remotePath = '/www/wwwroot/n1.namainvist.com/src/app/api/purchases/ocr/route.ts';

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log('Uploading OCR route to N1...');
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) throw err;
            console.log('Upload OK. Building and restarting N1...');
            conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log('N1 Restarted successfully.');
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
