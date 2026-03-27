const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected to Hetzner. Forcing explicit npm installs and rebuilds for N2-N10...');
    const bashScript = `
nohup sh -c '
echo "Starting Deep Dependency Fix N2-N10..." > /www/wwwroot/fix_deps_log.txt
for i in {2..10}; do
    echo "Fixing N$i..." >> /www/wwwroot/fix_deps_log.txt
    
    cd /www/wwwroot/n$i.namainvist.com
    rm -rf .next
    
    # Explicitly install the missing non-saved dependencies
    npm install next-auth zatca-xml-js qrcode --legacy-peer-deps >> /www/wwwroot/fix_deps_log.txt 2>&1
    npx prisma generate >> /www/wwwroot/fix_deps_log.txt 2>&1
    npm run build >> /www/wwwroot/fix_deps_log.txt 2>&1
    pm2 restart n$i >> /www/wwwroot/fix_deps_log.txt 2>&1
    
    echo "N$i cleanly rebuilt and restarted with all modules!" >> /www/wwwroot/fix_deps_log.txt
done
echo "All servers successfully recovered!" >> /www/wwwroot/fix_deps_log.txt
' > /dev/null 2>&1 &
    `;
    
    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('✅ Deep Dependency Fix initiated in background!');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
