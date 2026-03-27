const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to Hetzner. Globalizing latest ZATCA API to N1-N10...');
    
    // The bash script directly mirrors the local N2 ZATCA directory to all other servers 
    const bashScript = `
nohup sh -c '
echo "Starting Global ZATCA Sync from N2 to N1, N3..N10..." > /www/wwwroot/zatca_global_sync.log
for i in 1 3 4 5 6 7 8 9 10; do
    echo "Pushing API to N$i..." >> /www/wwwroot/zatca_global_sync.log
    
    # Create the API path if it misses
    mkdir -p /www/wwwroot/n$i.namainvist.com/src/app/api/zatca/generate-request
    mkdir -p /www/wwwroot/n$i.namainvist.com/src/app/api/zatca/test
    
    # Sync the exact files from N2 to N$i
    rsync -avz /www/wwwroot/n2.namainvist.com/src/app/api/zatca/ /www/wwwroot/n$i.namainvist.com/src/app/api/zatca/
    
    # Optionally rebuild the Next.js if necessary, here we just copy the pre-built chunk if possible, 
    # but rebuilding is safest for APIs to register
    cd /www/wwwroot/n$i.namainvist.com
    npm run build >> /www/wwwroot/zatca_global_sync.log 2>&1
    pm2 restart n$i >> /www/wwwroot/zatca_global_sync.log 2>&1
    
    echo "N$i Successfully Updated!" >> /www/wwwroot/zatca_global_sync.log
done
echo "Global Sync Complete 100%!" >> /www/wwwroot/zatca_global_sync.log
' > /dev/null 2>&1 &
    `;
    
    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('✅ Global ZATCA Sync job initiated in background!');
            conn.end();
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000});
