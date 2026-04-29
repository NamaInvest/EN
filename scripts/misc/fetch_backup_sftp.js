const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    // We will execute a tar command on the remote server to zip it, then download the zip.
    // Use quotes around "(dashboard)" to prevent bash syntax errors.
    conn.exec('tar -czf /root/backup_dashboard.tar.gz -C /www/wwwroot/n1.namainvist.com/src/app "(dashboard)"', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Tar created on remote with code ' + code);
            
            sftp.fastGet('/root/backup_dashboard.tar.gz', path.join(__dirname, 'backup_dashboard.tar.gz'), {}, (err) => {
                if (err) throw err;
                console.log('Successfully downloaded backup_dashboard.tar.gz');
                conn.end();
            });
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
        });
    });
  });
}).connect({
  host: '46.4.188.170',
  port: 22,
  username: 'root',
  password: '_ee4SWbxLVfH9b',
  readyTimeout: 20000
});
