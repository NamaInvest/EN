const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to VPS: 185.197.195.202');
    // Trigger build detached and don't care about the output
    const cmd = `cd /var/www/namasoft && rm -f /tmp/build_sync.log && nohup bash -c "npx prisma generate && npm run build > /tmp/build_sync.log 2>&1 && pm2 restart namasoft" > /dev/null 2>&1 &`;
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
    host: '185.197.195.202', port: 22, username: 'root', password: 'VmJUML2LuezRSws', keepaliveInterval: 10000
});
