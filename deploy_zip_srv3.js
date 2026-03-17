const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const hostIp = '204.168.144.74';
const conn = new Client();

const remoteScript = `#!/bin/bash
cd /var/www/namasoft || exit 1
apt-get update
apt-get install -y unzip
unzip -q -o src.zip
rm -f src.zip
npx prisma generate
rm -f /tmp/build_sync.log
nohup bash -c "npx prisma db push --accept-data-loss && npm run build > /tmp/build_sync.log 2>&1 && pm2 restart namasoft" > /dev/null 2>&1 &
echo "[3/3] Background Build successfully triggered on ${hostIp}!"
`;

conn.on('ready', () => {
    console.log('Connected to VPS: ' + hostIp);
    
    conn.exec('cat > /var/www/namasoft/remote_deploy.sh', (err, stream) => {
        if (err) { console.error(err); process.exit(1); }
        stream.write(remoteScript);
        stream.end();
        
        console.log('Deploy script written. Uploading src.zip...');
        conn.sftp((err, sftp) => {
            if (err) { console.error(err); process.exit(1); }
            sftp.fastPut('d:/namasoft9-3-main/src.zip', '/var/www/namasoft/src.zip', (e) => {
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
