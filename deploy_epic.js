const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Grand Epic Deployment (Phases 1, 2, 3)...');

try {
    console.log('📦 Zipping payload...');
    const posh = '"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"';
    execSync(`${posh} -Command "Compress-Archive -Path src, prisma, package.json -DestinationPath grand_update.zip -Force"`, { stdio: 'inherit' });

    const key = "C:\\Users\\1\\.ssh\\hetzner_key";
    const ip = "root@46.4.188.170";
    const scp = '"C:\\Windows\\System32\\OpenSSH\\scp.exe"';
    const ssh = '"C:\\Windows\\System32\\OpenSSH\\ssh.exe"';

    console.log('☁️ Uploading to Primary Server (N1)...');
    execSync(`${scp} -o StrictHostKeyChecking=no -i "${key}" grand_update.zip ${ip}:/www/wwwroot/n1.namainvist.com/grand_update.zip`, { stdio: 'inherit' });

    console.log('🔨 Building locally on N1...');
    const buildN1 = `
cd /www/wwwroot/n1.namainvist.com &&
unzip -o grand_update.zip ;
npx prisma db push &&
rm -rf .next &&
npm run build &&
pm2 restart all
    `;
    execSync(`${ssh} -o StrictHostKeyChecking=no -i "${key}" ${ip} "${buildN1.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });

    console.log('🌐 Replicating to Global Fleet (N2-N10)...');
    const syncN2 = `
for i in {2..10}; do
  DEST="/www/wwwroot/n$i.namainvist.com"
  if [ -d "$DEST" ]; then
    echo "Updating N$i..."
    cp -r /www/wwwroot/n1.namainvist.com/src $DEST/
    cp -r /www/wwwroot/n1.namainvist.com/prisma $DEST/
    cp /www/wwwroot/n1.namainvist.com/package.json $DEST/
    cd $DEST
    npx prisma db push
    rm -rf .next
    npm run build
  fi
done
pm2 restart all
    `;
    // We execute replication in background mostly.
    console.log('Waiting for replication to finish... This may take 5-10 minutes.');
    execSync(`${ssh} -o StrictHostKeyChecking=no -i "${key}" ${ip} "${syncN2.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });

    console.log('✅ Grand Epic Deployment Completed Successfully!');
} catch (e) {
    console.error('❌ Failed Deployment:', e.message);
}
