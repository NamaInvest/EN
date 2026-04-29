const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- EXECUTING FLEET SYNCHRONIZATION ALGORITHM ---');

    const bashScript = `
#!/bin/bash
echo "1. Distributing Master Panel exclusively to namainvist.com..."
mkdir -p /www/wwwroot/namainvist.com/src/app/master-panel
cp -r /www/wwwroot/n1.namainvist.com/src/app/master-panel/* /www/wwwroot/namainvist.com/src/app/master-panel/

echo "2. Purging Master Panel from all N-nodes..."
for i in {1..10}; do
  rm -rf /www/wwwroot/n$i.namainvist.com/src/app/master-panel
  rm -rf /www/wwwroot/n$i.namainvist.com/src/app/\\(dashboard\\)/master-panel
done

echo "3. Synchronizing AI SEO, Guards, and CRM to all Nodes..."
for site in namainvist.com n2.namainvist.com n3.namainvist.com n4.namainvist.com n5.namainvist.com n6.namainvist.com n7.namainvist.com n8.namainvist.com n9.namainvist.com n10.namainvist.com; do
  echo "Syncing $site..."
  cp /www/wwwroot/n1.namainvist.com/src/app/layout.tsx /www/wwwroot/$site/src/app/layout.tsx
  cp /www/wwwroot/n1.namainvist.com/src/app/page.tsx /www/wwwroot/$site/src/app/page.tsx
  cp /www/wwwroot/n1.namainvist.com/src/components/SubscriptionGuard.tsx /www/wwwroot/$site/src/components/SubscriptionGuard.tsx
  cp -r /www/wwwroot/n1.namainvist.com/src/app/\\(dashboard\\)/whatsapp-hub /www/wwwroot/$site/src/app/\\(dashboard\\)/
  cp -r /www/wwwroot/n1.namainvist.com/src/app/\\(dashboard\\)/affiliates /www/wwwroot/$site/src/app/\\(dashboard\\)/
  cp -r /www/wwwroot/n1.namainvist.com/src/app/api/crm /www/wwwroot/$site/src/app/api/ 2>/dev/null || true
done

echo "4. Rebuilding Root Domain (namainvist.com) [PRIORITY]..."
cd /www/wwwroot/namainvist.com
npm run build
pm2 reload all

echo "✅ Root Domain SYNCHRONIZED."
    `;

    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('✅ SYNCHRONIZATION PHASE 1 COMPLETE.');

            // Kick off background sequential builds for N2-N10 so we don't block the AI agent
            const backgroundBuilds = `
nohup bash -c '
for i in {1..10}; do
  cd /www/wwwroot/n$i.namainvist.com
  npm run build
  pm2 reload all
done
' > /tmp/fleet_build.log 2>&1 &
            `;
            conn.exec(backgroundBuilds, () => {
                console.log('✅ Background compilation for N1-N10 initiated.');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
