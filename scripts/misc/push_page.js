const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected! Uploading page.tsx to N1...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const localPath = 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/settings/page.tsx';
        const remotePath = '/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/settings/page.tsx';
        
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) throw err;
            console.log('Upload complete! Rebuilding N1...');
            conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1', (err, stream) => {
                if (err) throw err;
                stream.on('close', () => conn.end())
                      .on('data', data => console.log(data.toString()))
                      .stderr.on('data', data => console.error(data.toString()));
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 60000});
