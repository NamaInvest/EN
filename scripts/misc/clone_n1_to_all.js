const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to Hetzner. Initiating 100% binary clone from N1 to N2-N10...');
    const bashScript = `
nohup sh -c '
echo "Starting Deep Binary Clone N2-N10..." > /www/wwwroot/clone_log.txt
for i in {2..10}; do
    echo "Cloning N1 to N$i..." >> /www/wwwroot/clone_log.txt
    
    # Force sync exactly what N1 has (including prebuilt .next and node_modules)
    rsync -a --delete --exclude=".env" --exclude="node_modules/.cache" /www/wwwroot/n1.namainvist.com/ /www/wwwroot/n$i.namainvist.com/
    
    # Restart the application natively
    cd /www/wwwroot/n$i.namainvist.com
    pm2 restart n$i >> /www/wwwroot/clone_log.txt 2>&1
    
    echo "N$i cleanly cloned and restarted!" >> /www/wwwroot/clone_log.txt
done
echo "All servers strictly cloned!" >> /www/wwwroot/clone_log.txt
' > /dev/null 2>&1 &
    `;
    
    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('✅ Deep Binary Clone initiated in background!');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
