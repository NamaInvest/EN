const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- REPAIRING 204.x TURBOPACK COMPILER (OOM FIX) ---');
    
    const cmd = `
        echo "1. Checking/Allocating 2GB Linux Swap File to prevent Next.js OOM kill..."
        if [ ! -f /swapfile ]; then
            fallocate -l 2G /swapfile
            chmod 600 /swapfile
            mkswap /swapfile
            swapon /swapfile
            echo "/swapfile none swap sw 0 0" >> /etc/fstab
            echo "✅ 2GB SWAP FILE PROVISIONED."
        else
            echo "✅ SWAP FILE ALREADY EXISTS."
        fi
        
        echo "\\n2. Verifying Memory Available..."
        free -h
        
        echo "\\n3. Forcing Clean Next.js Production Build (with GC exposed)..."
        cd /var/www/namasoft
        
        # Limiting Node.js memory specifically to prevent it from trying to consume physical RAM over the limits
        NODE_OPTIONS="--max-old-space-size=2048" npm run build
        
        echo "\\n4. Rebooting PM2 process..."
        pm2 restart namasoft --update-env
        
        echo "✅ SYSTEMS COMPLETELY RESTORED."
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
    readyTimeout: 10000
});
