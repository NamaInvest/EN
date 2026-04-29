const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to VPS: 95.217.187.44');
    const cmd = `cd /var/www/namasoft && rm -f /tmp/build_sync.log && nohup bash -c "npm run build > /tmp/build_sync.log 2>&1 && pm2 restart namasoft" > /dev/null 2>&1 &`;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('Build triggered successfully in background!');
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('Connection error:', err);
}).connect({
    host: '95.217.187.44', port: 22, username: 'root', privateKey: require('fs').readFileSync('C:/Users/1/.ssh/hetzner_key'), keepaliveInterval: 10000
});
