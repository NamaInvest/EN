const { Client } = require('ssh2');
const fs = require('fs');

const hostIp = '204.168.144.74';
const conn = new Client();

const remoteScript = `#!/bin/bash
set -ex
cd /var/www/namasoft || exit 1
unzip -q -o deploy.zip
rm -f deploy.zip
npm install
npx prisma generate
rm -f /tmp/build_sync.log
nohup bash -c "npm run build > /tmp/build_sync.log 2>&1 && pm2 restart namasoft && cd /var/www/namasoft2 && cp -r /var/www/namasoft/* . && npm run build > /tmp/build_sync2.log 2>&1 && pm2 restart namasoft2" > /dev/null 2>&1 &
echo "[DONE] Background Build successfully triggered on ${hostIp}!"
`;

conn.on('ready', () => {
    console.log('Connected to VPS: ' + hostIp);
    
    conn.exec('cat > /var/www/namasoft/remote_deploy.sh', (err, stream) => {
        if (err) { console.error(err); process.exit(1); }
        stream.write(remoteScript);
        stream.end();
        
        console.log('Deploy script written. Uploading deploy.zip...');
        conn.sftp((err, sftp) => {
            if (err) { console.error(err); process.exit(1); }
            sftp.fastPut('c:/Users/1/Desktop/alfa/deploy.zip', '/var/www/namasoft/deploy.zip', (e) => {
                if (e) { console.error(e); process.exit(1); }
                console.log('Zip uploaded. Executing remote build...');
                conn.exec('bash /var/www/namasoft/remote_deploy.sh', (e2, s2) => {
                    if (e2) { console.error(e2); process.exit(1); }
                    s2.on('data', d => console.log('REMOTE:', d.toString()));
                    s2.on('close', () => { 
                        console.log('Deployment script execution finished!'); 
                        conn.end(); 
                    });
                });
            });
        });
    });

}).on('error', (err) => {
    console.error('Connection error:', err);
    process.exit(1);
}).connect({
    host: hostIp, port: 22, username: 'root', privateKey: fs.readFileSync('C:/Users/1/Desktop/namasoftkey/namasoft_key'), keepaliveInterval: 10000
});
