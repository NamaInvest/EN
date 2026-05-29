const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
echo "=== Nginx Proxies ==="
cat /www/server/nginx/conf/nginx.conf | grep proxy_cache_path

echo "=== Purging all Nginx caches ==="
rm -rf /www/server/nginx/proxy_cache_dir/* 2>/dev/null
rm -rf /tmp/nginx_cache/* 2>/dev/null
find /www/server/nginx/ -name "*cache*" -type d -exec rm -rf {}/* 2>/dev/null \\;

echo "=== Restarting Nginx ==="
systemctl restart nginx || service nginx restart || /etc/init.d/nginx restart

echo "=== Done ==="
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
