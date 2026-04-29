const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const localBase = 'C:/Users/1/Desktop/zatca-einvoicing-sdk-Java-238-R3.4.8';
const remoteBase = '/root/zatca-sdk';

const conn = new Client();

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });
    return arrayOfFiles;
}

conn.on('ready', () => {
    console.log('Connected! Starting recursive SFTP...');
    conn.exec('rm -rf ' + remoteBase + ' && mkdir -p ' + remoteBase, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                if (err) throw err;
                const files = getAllFiles(localBase);
                console.log('Found ' + files.length + ' files to upload.');
                
                let i = 0;
                function uploadNext() {
                    if (i >= files.length) {
                        console.log('All files uploaded! Setting symlinks...');
                        conn.exec('chmod +x /root/zatca-sdk/fatoora && ln -sf /root/zatca-sdk/fatoora /usr/local/bin/fatoora', (err, stream2) => {
                            if (err) throw err;
                            stream2.on('close', () => conn.end());
                        });
                        return;
                    }
                    
                    const localPath = files[i];
                    const relativePath = localPath.replace(path.normalize(localBase), '').replace(/\\/g, '/');
                    const remotePath = remoteBase + relativePath;
                    const remoteDir = path.posix.dirname(remotePath);
                    
                    sftp.mkdir(remoteDir, { mode: '0755' }, (err) => {
                        // ignore mkdir error if exists
                        sftp.fastPut(localPath, remotePath, (err) => {
                            if (err) console.error('Error uploading ' + relativePath, err);
                            i++;
                            if (i % 10 === 0) console.log('Uploaded ' + i + '/' + files.length);
                            uploadNext();
                        });
                    });
                }
                
                uploadNext();
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000});
