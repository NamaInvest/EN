const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected to Hetzner. Initiating background sync for N2-N10...');
    const bashScript = `
nohup sh -c '
for i in {2..10}; do
    echo "Syncing N$i..."
    cp -r /www/wwwroot/namainvist.com/src/app/api/settings/generate-keys /www/wwwroot/n$i.namainvist.com/src/app/api/settings/ 2>/dev/null
    cp -r /www/wwwroot/namainvist.com/src/app/api/settings/zatca-onboard /www/wwwroot/n$i.namainvist.com/src/app/api/settings/ 2>/dev/null
    cp -r /www/wwwroot/namainvist.com/src/app/api/zatca /www/wwwroot/n$i.namainvist.com/src/app/api/ 2>/dev/null
    cp -r /www/wwwroot/namainvist.com/src/app/onboarding/zatca /www/wwwroot/n$i.namainvist.com/src/app/onboarding/ 2>/dev/null
    cp -r /www/wwwroot/namainvist.com/src/lib/zatca-java.ts /www/wwwroot/n$i.namainvist.com/src/lib/ 2>/dev/null
    cd /www/wwwroot/n$i.namainvist.com
    npm install next-auth zatca-xml-js qrcode --legacy-peer-deps
    npm run build
    pm2 restart n$i
done
' > /www/wwwroot/sync_n2_n10_log.txt 2>&1 &
    `;
    
    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('✅ Background sync triggered successfully! The 9 servers are now building independently.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000 });
