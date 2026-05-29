const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected to Hetzner. Initiating ROOT Config + SRC sync for N2-N10...');
    const bashScript = `
nohup sh -c '
echo "Starting Deep Root Sync N2-N10..." > /www/wwwroot/sync_root_log.txt
for i in {2..10}; do
    echo "Distributing N1 core to N$i..." >> /www/wwwroot/sync_root_log.txt
    
    # Force copy ALL required project files from N1 to replica
    rsync -av /www/wwwroot/n1.namainvist.com/src/ /www/wwwroot/n$i.namainvist.com/src/
    rsync -av /www/wwwroot/n1.namainvist.com/prisma/ /www/wwwroot/n$i.namainvist.com/prisma/
    cp /www/wwwroot/n1.namainvist.com/package.json /www/wwwroot/n$i.namainvist.com/
    cp /www/wwwroot/n1.namainvist.com/next.config.mjs /www/wwwroot/n$i.namainvist.com/ || true
    cp /www/wwwroot/n1.namainvist.com/next.config.js /www/wwwroot/n$i.namainvist.com/ || true
    cp /www/wwwroot/n1.namainvist.com/middleware.ts /www/wwwroot/n$i.namainvist.com/ || true
    cp /www/wwwroot/n1.namainvist.com/middleware.js /www/wwwroot/n$i.namainvist.com/ || true
    
    # Clean cache and Rebuild
    cd /www/wwwroot/n$i.namainvist.com
    rm -rf .next
    
    npm install --legacy-peer-deps >> /www/wwwroot/sync_root_log.txt 2>&1
    npx prisma generate >> /www/wwwroot/sync_root_log.txt 2>&1
    npm run build >> /www/wwwroot/sync_root_log.txt 2>&1
    pm2 restart n$i >> /www/wwwroot/sync_root_log.txt 2>&1
    
    echo "N$i cleanly rebuilt and restarted!" >> /www/wwwroot/sync_root_log.txt
done
echo "All servers successfully deep-cloned!" >> /www/wwwroot/sync_root_log.txt
' > /dev/null 2>&1 &
    `;
    
    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('✅ Deep Root code sync initiated in background!');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000 });
