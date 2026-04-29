const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Connected to fleet server');
    
    const cmd = `
echo "=== PM2 LIST ==="
pm2 list
echo ""
echo "=== MAIN-SITE LOGS (last 50 lines) ==="
pm2 logs main-site --lines 50 --nostream 2>&1
echo ""
echo "=== DISK SPACE ==="
df -h / | tail -1
echo ""
echo "=== MEMORY ==="
free -h | head -2
echo ""
echo "=== NGINX STATUS ==="
systemctl status nginx --no-pager -l 2>&1 | head -15
echo ""
echo "=== PORT 2999 CHECK ==="
curl -s -o /dev/null -w "%{http_code}" http://localhost:2999/ 2>&1 || echo "FAILED"
echo ""
echo "=== MAIN-SITE PROCESS ==="
ps aux | grep -E "(node|next)" | grep -v grep | head -10
    `;
    
    conn.exec(cmd, (err, stream) => {
        if (err) { console.error('Exec error:', err); conn.end(); return; }
        let output = '';
        stream.on('data', d => { output += d.toString(); process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => { output += d.toString(); process.stderr.write(d.toString()); });
        stream.on('close', () => { conn.end(); });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000
});
