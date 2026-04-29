const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected to Hetzner. Initiating FULL SRC sync for N2-N10...');
    const bashScript = `
nohup sh -c '
echo "Starting Full SRC Sync N2-N10..." > /www/wwwroot/sync_all_log.txt
for i in {2..10}; do
    echo "Processing N$i..." >> /www/wwwroot/sync_all_log.txt
    
    # Force copy the entire src directory from N1 to replica
    rsync -av /www/wwwroot/n1.namainvist.com/src/ /www/wwwroot/n$i.namainvist.com/src/
    
    # Clean cache and Rebuild
    cd /www/wwwroot/n$i.namainvist.com
    rm -rf .next
    
    npm install next-auth zatca-xml-js qrcode --legacy-peer-deps >> /www/wwwroot/sync_all_log.txt 2>&1
    npx prisma generate >> /www/wwwroot/sync_all_log.txt 2>&1
    npm run build >> /www/wwwroot/sync_all_log.txt 2>&1
    pm2 restart n$i >> /www/wwwroot/sync_all_log.txt 2>&1
    
    echo "N$i completed!" >> /www/wwwroot/sync_all_log.txt
done
echo "All servers successfully cloned and rebuilt!" >> /www/wwwroot/sync_all_log.txt
' > /dev/null 2>&1 &
    `;
    
    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('✅ Full Source code sync initiated in background!');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
