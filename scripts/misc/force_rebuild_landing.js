const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 120000 };

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected. Starting FORCED clean rebuild of namainvist.com landing...');
    
    // Do a complete clean rebuild synchronously (but nohup for long operations)
    const cmd = `nohup sh -c '
        cd /www/wwwroot/namainvist.com
        echo "=== STEP 1: Killing old process ==="
        pm2 stop nama-landing 2>&1 || true
        
        echo "=== STEP 2: Removing old build ==="
        rm -rf .next
        
        echo "=== STEP 3: Building fresh ==="
        npm run build 2>&1
        
        echo "=== STEP 4: Restarting process ==="
        pm2 restart nama-landing 2>&1 || pm2 start npm --name "nama-landing" -- start -- -p 2999
        
        echo "=== BUILD COMPLETE ==="
    ' > /www/wwwroot/nama_landing_rebuild.log 2>&1 &
    echo "PID: $!"`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('Background build launched:', out.trim());
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
