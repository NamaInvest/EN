const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected! Uploading patched ZATCA API Route to N2...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const lPath = 'c:/Users/1/Desktop/alfa/src/app/api/zatca/route.ts';
        const rPath = '/www/wwwroot/n2.namainvist.com/src/app/api/zatca/route.ts';
        
        sftp.fastPut(lPath, rPath, (err) => {
            if (err) throw err;
            console.log('Upload complete! Rebuilding N2...');
            conn.exec('cd /www/wwwroot/n2.namainvist.com && npm run build && pm2 restart n2', (err, stream) => {
                stream.on('close', () => conn.end()).on('data', data => process.stdout.write(data.toString()));
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 60000});
