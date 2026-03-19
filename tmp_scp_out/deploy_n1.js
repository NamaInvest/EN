const { Client } = require('ssh2');
const fs = require('fs');

const hostIp = '46.4.188.170';
const targetDir = '/www/wwwroot/n1.namainvist.com';
const conn = new Client();

const remoteScript = `#!/bin/bash
set -ex
mkdir -p ${targetDir}
cd ${targetDir} || exit 1
unzip -q -o src.zip
rm -f src.zip
echo "Deployment folder created and unzipped."
`;

conn.on('ready', () => {
    console.log('Connected to Hetzner VPS: ' + hostIp);
    
    conn.exec(`cat > /tmp/deploy_n1.sh`, (err, stream) => {
        if (err) { console.error(err); process.exit(1); }
        stream.write(remoteScript);
        stream.end();
        
        console.log('Deploy script written. Uploading src.zip...');
        conn.sftp((err, sftp) => {
            if (err) { console.error(err); process.exit(1); }
            
            conn.exec(`mkdir -p ${targetDir}`, (mkdirErr) => {
                if (mkdirErr) { console.error('mkdir error:', mkdirErr); }
                console.log('mkdir command sent. Now putting zip...');
                sftp.fastPut('d:/namasoft9-3-main/src.zip', `${targetDir}/src.zip`, (e) => {
                    if (e) { console.error('fastPut error:', e); process.exit(1); }
                    console.log('Zip uploaded. Executing remote unzipping...');
                    conn.exec('bash /tmp/deploy_n1.sh', (e2, s2) => {
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
    });

}).on('error', (err) => {
    console.error('Connection error:', err);
    process.exit(1);
}).connect({
    host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000
});
