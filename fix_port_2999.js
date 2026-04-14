const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected...');

    // 1. Stop current process
    // 2. Start on port 2999
    // 3. Update nginx to proxy to 2999
    // 4. Reload nginx
    const cmd = `
pm2 delete n1-main 2>/dev/null || true
cd /www/wwwroot/n1.namainvist.com
sed -i 's/^PORT=.*/PORT=2999/' .env
pm2 start node_modules/next/dist/bin/next --name "n1-main" -- start -p 2999
pm2 save

# Update nginx to use port 2999
sed -i 's/proxy_pass http:\\/\\/localhost:3000/proxy_pass http:\\/\\/localhost:2999/g' /etc/nginx/sites-available/namainvist.com
nginx -t && systemctl reload nginx
echo "DONE_PORT_2999"
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('\nDone!');
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: '_ee4SWbxLVfH9b'
});
