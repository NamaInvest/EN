const { Client } = require('ssh2');
const conn = new Client();
const fileToUpload = 'd:/namasoft9-3-main/src/components/Sidebar.tsx';
const remotePath = '/www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx';

conn.on('ready', () => {
    console.log('Connected to server');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(fileToUpload, remotePath, {}, (putErr) => {
            if (putErr) throw putErr;
            console.log(`Uploaded Sidebar.tsx manually to ${remotePath}`);
            conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart saas-app && cd /www/wwwroot/namainvist.com && pm2 restart main-site', (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('close', () => {
                    console.log('Deploy and restart process closed.');
                    conn.end();
                }).on('data', (data) => {
                    console.log('STDOUT: ' + data);
                }).stderr.on('data', (data) => {
                    console.error('STDERR: ' + data);
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
