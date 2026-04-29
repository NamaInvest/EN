const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected! Uploading Step 4 API to N2...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        // Ensure directory exists
        conn.exec('mkdir -p /www/wwwroot/n2.namainvist.com/src/app/api/zatca/generate-request', (err) => {
            if (err) throw err;
            
            const localPath = 'c:/Users/1/Desktop/alfa/src/app/api/zatca/generate-request/route.ts';
            const remotePath = '/www/wwwroot/n2.namainvist.com/src/app/api/zatca/generate-request/route.ts';
            
            sftp.fastPut(localPath, remotePath, (err) => {
                if (err) throw err;
                console.log('Upload complete! Rebuilding N2...');
                conn.exec('cd /www/wwwroot/n2.namainvist.com && npm run build && pm2 restart n2', (err, stream) => {
                    if (err) throw err;
                    stream.on('close', () => conn.end())
                          .on('data', data => process.stdout.write(data.toString()))
                          .stderr.on('data', data => process.stderr.write(data.toString()));
                });
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000});
