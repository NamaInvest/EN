const { execSync } = require('child_process');
const fs = require('fs');

const hostIp = process.argv[2];
const keyFile = process.argv[3];
const sshUser = 'root';

if (!hostIp || !keyFile) {
    console.error('Please provide IP and Key File');
    process.exit(1);
}

const sshOpts = `-i ${keyFile} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`;

const remoteScript = `#!/bin/bash
cd /var/www/namasoft || exit 1
apt-get update
apt-get install -y unzip
unzip -q -o src.zip
rm -f src.zip
npx prisma db push --schema=prisma/schema.prisma
npx prisma generate
rm -f /tmp/build_sync.log
nohup bash -c "npm run build > /tmp/build_sync.log 2>&1 && pm2 restart namasoft" > /dev/null 2>&1 &
echo "[3/3] Background Build successfully triggered on ${hostIp}!"
`;

try {
    fs.writeFileSync('remote_deploy.sh', remoteScript);
    
    console.log(`[1/3] Uploading src.zip and remote_deploy.sh to ${sshUser}@${hostIp}...`);
    execSync(`scp ${sshOpts} d:/namasoft9-3-main/src.zip ${sshUser}@${hostIp}:/var/www/namasoft/src.zip`, { stdio: 'inherit' });
    execSync(`scp ${sshOpts} d:/namasoft9-3-main/remote_deploy.sh ${sshUser}@${hostIp}:/var/www/namasoft/remote_deploy.sh`, { stdio: 'inherit' });
    
    console.log(`[2/3] Executing build script remotely...`);
    execSync(`ssh ${sshOpts} ${sshUser}@${hostIp} "bash /var/www/namasoft/remote_deploy.sh"`, { stdio: 'inherit' });
    
    console.log('Deployment script finished successfully!');

} catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
}
