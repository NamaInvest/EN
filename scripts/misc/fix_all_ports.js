const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected...');

    const cmd = `
echo "=== FIXING PORT ASSIGNMENTS ==="

# Step 1: Fix N1 — must be on port 3001
echo "[1] Fixing N1 port to 3001..."
pm2 delete n1-main 2>/dev/null || true
sed -i 's/^PORT=.*/PORT=3001/' /www/wwwroot/n1.namainvist.com/.env
pm2 start node_modules/next/dist/bin/next --name "n1-main" --cwd "/www/wwwroot/n1.namainvist.com" -- start -p 3001
pm2 save
echo "N1 started on 3001"

# Step 2: Fix Main Site — must be on port 2999
echo "[2] Fixing main site port to 2999..."
pm2 delete main-site 2>/dev/null || true
sed -i 's/^PORT=.*/PORT=2999/' /www/wwwroot/namainvist.com/.env
pm2 start node_modules/next/dist/bin/next --name "main-site" --cwd "/www/wwwroot/namainvist.com" -- start -p 2999
pm2 save
echo "Main site started on 2999"

# Step 3: Fix nginx — main site must proxy to 2999
echo "[3] Checking nginx..."
grep "proxy_pass" /etc/nginx/sites-available/namainvist.com

pm2 list --no-color
echo "=== DONE ==="
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('\nAll done!');
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: 'process.env.SSH_PASSWORD'
});
