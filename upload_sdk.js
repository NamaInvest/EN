const fs = require('fs');
const { Client } = require('ssh2');

const conn = new Client();

console.log('Connecting to HETZNER N1 via SSH...');

conn.on('ready', () => {
    console.log('Connected! Starting SFTP...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log('SFTP Session Started. Uploading zatca-sdk.zip...');
        const localFile = 'D:/namasoft9-3-main/zatca-sdk.zip';
        const remoteFile = '/root/zatca-sdk.zip';
        
        sftp.fastPut(localFile, remoteFile, (err) => {
            if (err) throw err;
            console.log('Upload complete! Extracting on remote server...');
            
            conn.exec('cd /root && rm -rf zatca-einvoicing-sdk-Java-238-R3.4.8 && unzip -q zatca-sdk.zip && chmod +x /root/zatca-einvoicing-sdk-Java-238-R3.4.8/fatoora && ln -s /root/zatca-einvoicing-sdk-Java-238-R3.4.8/fatoora /usr/local/bin/fatoora', (err, stream) => {
                if (err) throw err;
                stream.on('close', (code, signal) => {
                    console.log('Extraction and Symlink Complete (Exit code: ' + code + ')');
                    conn.end();
                }).on('data', (data) => {
                    console.log('STDOUT: ' + data);
                }).stderr.on('data', (data) => {
                    console.log('STDERR: ' + data);
                });
            });
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 60000
});
