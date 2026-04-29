const { Client } = require('ssh2');

const LANDING = '/www/wwwroot/namainvist.com';

// The nuclear option: modify nginx to add no-cache headers and force redirect
const bashScript = `
echo "=== Adding nginx no-cache headers for onboarding ==="
NGINX_CONF="/etc/nginx/sites-available/namainvist.com"

# Check current nginx config
cat $NGINX_CONF

echo ""
echo "=== Adding cache-control headers ==="
# Add Cache-Control headers to nginx for the onboarding path
cat > /tmp/nginx_onboarding_fix.conf << 'EOF'
server {
    listen 80;
    listen 443 ssl http2;
    server_name namainvist.com www.namainvist.com;

    ssl_certificate /etc/ssl/namainvist/origin.crt;
    ssl_certificate_key /etc/ssl/namainvist/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /onboarding {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
        add_header Pragma "no-cache" always;
        add_header Surrogate-Control "no-store" always;
        add_header CDN-Cache-Control "no-store" always;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

cp /tmp/nginx_onboarding_fix.conf $NGINX_CONF
nginx -t && systemctl reload nginx && echo "NGINX RELOADED OK"

echo ""
echo "=== What port is namainvist.com using? ==="
cat /www/wwwroot/namainvist.com/.env | grep PORT
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
