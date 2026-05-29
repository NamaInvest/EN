const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected! Uploading patched generate-keys/route.ts to N2...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const localPath = 'c:/Users/1/Desktop/alfa/src/app/api/settings/generate-keys/route.ts';
        const remotePath = '/www/wwwroot/n2.namainvist.com/src/app/api/settings/generate-keys/route.ts';
        
        sftp.fastPut(localPath, remotePath, (errPut) => {
            if (errPut) throw errPut;
            console.log('Upload complete! Rebuilding N2...');
            
            const recompileCmd = `cd /www/wwwroot/n2.namainvist.com && npm run build && pm2 restart n2`;
            
            conn.exec(recompileCmd, (errExec, stream) => {
                if (errExec) throw errExec;
                stream.on('close', () => {
                    console.log('\\n✅ REBUILD COMPLETE. N2 CSR NOW PROPERLY SIGNS USING SECP256K1!');
                    conn.end();
                }).on('data', d => process.stdout.write(d.toString()))
                  .stderr.on('data', d => process.stdout.write('ERR: ' + d.toString()));
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
