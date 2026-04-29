const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- PURGING OBSOLETE MASTER ROUTES & REBUILDING (204.x) ---');
    
    // We remove the broken Phase 86 multi-tenant routing files that caused 'Unterminated template'
    const cmd = `
        echo "1. Deleting broken experimental Phase 86 files..."
        cd /var/www/namasoft
        rm -rf src/app/master
        rm -rf src/app/api/master
        rm -f src/app/api/auth/me/route.ts
        
        echo "2. Rebuilding the pure monolith..."
        NODE_OPTIONS="--max-old-space-size=2048" nohup bash -c 'npm run build && pm2 restart namasoft' > build_phase88_final.log 2>&1 &
        echo "✅ BACKGROUND COMPILATION RESTARTED (Detached)."
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
