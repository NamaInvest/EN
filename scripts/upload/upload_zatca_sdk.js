const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const localFolderPath = 'C:\\\\Users\\\\1\\\\Desktop\\\\zatca-einvoicing-sdk-Java-238-R3.4.8';
const remoteFolderPath = '/opt/zatca-einvoicing-sdk-238-R3.4.8';

conn.on('ready', () => {
    console.log('Client :: ready');
    conn.exec(`mkdir -p ${remoteFolderPath}/Apps/Data/Certificates`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
             console.log('Created remote folders. Starting upload via SFTP...');
             conn.sftp((err, sftp) => {
                 if (err) throw err;
                 
                 const uploadFile = (localFile, remoteFile) => {
                     return new Promise((resolve, reject) => {
                         sftp.fastPut(localFile, remoteFile, (err) => {
                             if (err) reject(err);
                             else {
                                 console.log(`Uploaded: ${remoteFile}`);
                                 resolve();
                             }
                         });
                     });
                 };

                 const uploadDir = async (localDir, remoteDir) => {
                     const items = fs.readdirSync(localDir);
                     for (const item of items) {
                         const localStat = fs.statSync(path.join(localDir, item));
                         const remotePathItem = `${remoteDir}/${item}`.replace(/\\/g, '/');
                         if (localStat.isDirectory()) {
                             await new Promise(r => sftp.mkdir(remotePathItem, () => r()));
                             await uploadDir(path.join(localDir, item), remotePathItem);
                         } else {
                             await uploadFile(path.join(localDir, item), remotePathItem);
                         }
                     }
                 };

                 uploadDir(localFolderPath, remoteFolderPath).then(() => {
                     console.log('✅ ALL SFTP UPLOADS COMPLETE! Setting permissions...');
                     conn.exec(`chmod +x ${remoteFolderPath}/Apps/fatoora`, (err, stream) => {
                         stream.on('close', () => {
                             console.log('Done!');
                             conn.end();
                         });
                     });
                 }).catch(e => {
                     console.error(e);
                     conn.end();
                 });
             });
        }).on('data', () => {});
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 10000
});
