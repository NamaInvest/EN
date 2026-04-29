const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected...');

    const nginxConf = `server {
    listen 80;
    listen 443 ssl http2;
    server_name n11.namainvist.com;

    ssl_certificate /etc/ssl/namainvist/origin.crt;
    ssl_certificate_key /etc/ssl/namainvist/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3011;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;

    const cmd = `
cat > /etc/nginx/sites-available/n11.namainvist.com << 'NGINXEOF'
${nginxConf}
NGINXEOF

ln -sf /etc/nginx/sites-available/n11.namainvist.com /etc/nginx/sites-enabled/n11.namainvist.com
nginx -t && systemctl reload nginx
echo "NGINX_N11_DONE"

echo "=== ALL PM2 ==="
pm2 list --no-color
echo "=== PORTS ==="
ss -tlnp | grep -E ':30[0-9]{2}'
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
