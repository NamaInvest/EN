const { Client } = require('ssh2');
const fs = require('fs');
const { execSync } = require('child_process');

console.log("1. Packaging the complete Namasoft codebase...");
try {
    execSync('node package_zip.js', { stdio: 'inherit' });
} catch (e) {
    console.error("Failed to package zip:", e);
    process.exit(1);
}

const localZipPath = 'd:/namasoft9-3-main/src.zip';
const remoteZipPath = '/root/ultimate.zip';

console.log("2. Connecting to the Cloud Server Farm (46.4.188.170)...");
const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Connection Established.');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log(`Uploading ${localZipPath} to ${remoteZipPath}...`);
        
        sftp.fastPut(localZipPath, remoteZipPath, (err) => {
            if (err) throw err;
            console.log('Upload Complete! Deploying aggressively across 10 nodes...');
            
            const massiveDeployScript = `
#!/bin/bash
echo "Commencing Phase 14 Master Update across N1 to N10..."
export PATH=$PATH:/www/server/nvm/versions/node/v24.14.0/bin
for i in {1..10}
do
  tenant="n$i.namainvist.com"
  if [ -d "/www/wwwroot/$tenant" ]; then
    echo "Updating $tenant..."
    cd /www/wwwroot/$tenant
    
    # Extract the payload
    unzip -qo /root/ultimate.zip
    
    # Sync DB
    npx prisma generate
    
    # Cleanup old Next.js build cache to prevent UI staleness
    rm -rf .next
    
    # Background Build and Restart
    nohup bash -c "npm run build && pm2 restart n$i && echo '$tenant Completed' >> /root/phase14_log.txt" > /tmp/build_$tenant.log 2>&1 &
  fi
done
echo "All 10 Node Builds Dispatched. They are compiling in the background!"
`;
            
            conn.exec(massiveDeployScript, (err, stream) => {
                if (err) throw err;
                stream.on('data', data => console.log(data.toString()));
                stream.on('close', () => {
                    console.log('Massive Deployment Sequence Initiated Successfully.');
                    conn.end();
                });
            });
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 20000,
    keepaliveInterval: 10000
});
