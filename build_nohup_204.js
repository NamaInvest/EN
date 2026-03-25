const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- TRIGGERING DETACHED NEXT.JS BUILD ON 204.x ---');
    
    // We run the build and restart command wrapped in nohup to detach it from the SSH session.
    // This prevents SSH connection resets (EPIPE) from killing the compiler mid-flight.
    const cmd = `
        echo "1. Initiating nohup background sequence..."
        cd /var/www/namasoft
        nohup bash -c 'npm run build && pm2 restart namasoft' > build_phase88.log 2>&1 &
        echo "✅ BACKGROUND COMPILATION STARTED (Detached from SSH)."
        echo "PID of background job: $!"
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log('STDOUT:', data.toString()))
              .stderr.on('data', data => console.error('STDERR:', data.toString()));
    });
}).on('error', (err) => {
    console.error('SSH Connection Failed:', err.message);
}).connect({
    host: '204.168.144.74', 
    port: 22, 
    username: 'root', 
    privateKey: fs.readFileSync('C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key'),
    readyTimeout: 10000,
    keepaliveInterval: 10000, // Send keepalive every 10s to prevent hangup
});
