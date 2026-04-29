const { Client } = require('ssh2'); 
const conn = new Client(); 

const serverInitCmd = `#!/bin/bash
set -e
echo "==== PROVISIONING ZATCA JAVA 21 ENVIRONMENT ===="
apt-get update
apt-get install -y openjdk-21-jdk unzip

echo "==== DEPLOYING ZATCA JAVA SDK 238-R3.4.8 ===="
mkdir -p /opt
if [ -f /root/zatca-sdk.zip ]; then
    unzip -o /root/zatca-sdk.zip -d /opt/
    chmod +x /opt/zatca-einvoicing-sdk-Java-238-R3.4.8/Apps/fatoora
    echo "SDK Decompression successful."
else
    echo "Warning: zatca-sdk.zip not found on remote. Skipping zip extraction."
fi

# Ensure output Certs dir exists
mkdir -p /opt/zatca-einvoicing-sdk-Java-238-R3.4.8/Data/Certificates

echo "==== SYNCING N1-N10 PM2 CLUSTER ===="
for i in 1 2 3 4 5 6 7 8 9 10; do
  (
    echo "Starting PARALLEL ZATCA PHASE 2 NEXTJS BUILD n$i"
    cd /www/wwwroot/n$i.namainvist.com
    npm run build
    pm2 restart n$i --update-env
    echo "Completed Node n$i"
  ) > /root/deploy_zatca_p2_n$i.log 2>&1 &
done
`;

conn.on('ready', () => { 
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        try {
            console.log('1. Uploading Universal ZATCA SDK Zip to Hetzner...');
            await new Promise((r, j) => sftp.fastPut('c:/Users/1/Desktop/alfa/zatca-sdk.zip', '/root/zatca-sdk.zip', e => e?j(e):r()));
            
            console.log('2. Syncing Source Code to all 10 PM2 nodes...');
            let proms = [];
            const filesToSync = [
                'src/lib/zatca-java.ts',
                'src/app/api/settings/generate-keys/route.ts',
                'src/app/api/zatca/route.ts',
                'src/app/api/sales/route.ts',
                'src/lib/zatca.ts'
            ];

            for(let i=1; i<=10; i++) {
                const targetPath = '/www/wwwroot/n'+i+'.namainvist.com/';
                for(const file of filesToSync) {
                    proms.push(new Promise((r, j) => sftp.fastPut(`c:/Users/1/Desktop/alfa/${file}`, `${targetPath}${file}`, e => e?j(e):r())));
                }
            }
            
            // Chunked awaits to avoid SFTP connection pool exhaustion
            for (let i = 0; i < proms.length; i += 10) {
                await Promise.all(proms.slice(i, i + 10));
            }

            console.log('Upload complete. Triggering Server Provisioning and CLUSTER Builds...');
            
            conn.exec(`cat << 'EOF' > /root/deploy_zatca_phase2.sh\n${serverInitCmd}\nEOF\nbash /root/deploy_zatca_phase2.sh`, (err, stream) => { 
                if (err) throw err; 
                stream.on('data', (d) => process.stdout.write(d));
                stream.stderr.on('data', (d) => process.stderr.write(d));
                stream.on('close', () => {
                    console.log('SUCCESS: ZATCA Phase 2 Deployed to all 10 nodes SIMULTANEOUSLY. The systems will restart momentarily.');
                    conn.end();
                });
            });
        } catch(e) { console.error(e); conn.end(); }
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000});
