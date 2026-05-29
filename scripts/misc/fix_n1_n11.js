const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected...');

    const cmd = `
echo "=== Killing orphan process on 3001 ==="
kill -9 1504 2>/dev/null || true
sleep 1

echo "=== Checking n1-main error logs ==="
pm2 logs n1-main --lines 20 --nostream 2>/dev/null | tail -20

echo "=== Fixing n1-main: delete and restart fresh ==="
pm2 delete n1-main 2>/dev/null || true
pm2 start node_modules/next/dist/bin/next --name "n1-main" --cwd "/www/wwwroot/n1.namainvist.com" -- start -p 3001
sleep 3
pm2 list --no-color | grep n1-main

echo "=== Starting N11 on port 3011 ==="
pm2 delete n11 2>/dev/null || true
pm2 start node_modules/next/dist/bin/next --name "n11" --cwd "/www/wwwroot/n11.namainvist.com" -- start -p 3011
sleep 2

echo "=== Checking N11 nginx config ==="
grep "proxy_pass" /etc/nginx/sites-available/n11.namainvist.com 2>/dev/null || echo "No nginx config for n11"

pm2 save
pm2 list --no-color

echo "=== PORTS NOW ==="
ss -tlnp | grep -E ':30[0-9]{2}'
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
