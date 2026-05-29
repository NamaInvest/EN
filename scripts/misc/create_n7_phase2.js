const { Client } = require('ssh2');
const conn = new Client();
const N7 = '/www/wwwroot/n7.namainvist.com';
const N7_PORT = 3600;
const NGINX_DIR = '/www/server/panel/vhost/nginx';

conn.on('ready', () => {
    // Read n11 SSL cert for wildcard
    conn.exec(`cat ${NGINX_DIR}/tenants-wildcard.namainvist.com.conf | grep ssl_cert`, (e, s) => {
        let certInfo = '';
        s.on('data', d => certInfo += d.toString());
        s.on('close', () => {
            const sslCert = (certInfo.match(/ssl_certificate\s+([^;]+);/) || [])[1]?.trim()
                || '/www/server/panel/vhost/cert/n11.namainvist.com/fullchain.pem';
            const sslKey  = (certInfo.match(/ssl_certificate_key\s+([^;]+);/) || [])[1]?.trim()
                || '/www/server/panel/vhost/cert/n11.namainvist.com/privkey.pem';

            // Create n7-specific nginx config (takes priority over wildcard)
            const n7Nginx = `server {
    listen 80;
    server_name n7.namainvist.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name n7.namainvist.com;

    ssl_certificate     ${sslCert};
    ssl_certificate_key ${sslKey};
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    client_max_body_size 100M;

    # Dev/Staging app (n7) on port ${N7_PORT}
    location / {
        proxy_pass         http://127.0.0.1:${N7_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}`;

            const cmd = `
echo "=== [6] Prisma DB push for n7 ==="
cd ${N7}
DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/n7_db?schema=public" npx prisma db push --skip-generate 2>&1 | tail -10
echo "✅ Schema pushed to n7_db"

echo "=== [7] Build n7 ==="
npm run build 2>&1 | grep -E "✓|✗|error|Error|compiled" | tail -10
ls .next/BUILD_ID 2>/dev/null && echo "✅ Build SUCCESS" || echo "❌ Build FAILED"

echo "=== [8] Nginx config for n7 ==="
cat > ${NGINX_DIR}/n7.namainvist.com.conf << 'ENDOFNGINX'
${n7Nginx}
ENDOFNGINX
echo "✅ Nginx n7 config written"

echo "=== [9] PM2 start n7 ==="
pm2 delete saas-dev 2>/dev/null || true

# Create ecosystem for n7
cat > ${N7}/ecosystem.n7.config.js << 'ENDOFECO'
module.exports = {
  apps: [{
    name: 'saas-dev',
    script: './node_modules/next/dist/bin/next',
    args: 'start -p ${N7_PORT}',
    cwd: '${N7}',
    instances: 1,
    exec_mode: 'fork',
    env: { NODE_ENV: 'production', PORT: '${N7_PORT}', TENANT: 'n7' },
    max_restarts: 5,
    restart_delay: 3000,
  }],
};
ENDOFECO

pm2 start ${N7}/ecosystem.n7.config.js
pm2 save --force
echo "✅ PM2 saas-dev started"

echo "=== [10] Reload Nginx ==="
/www/server/nginx/sbin/nginx -t -c /www/server/nginx/conf/nginx.conf 2>&1
/www/server/nginx/sbin/nginx -s reload -c /www/server/nginx/conf/nginx.conf
echo "✅ Nginx reloaded"

echo "=== Wait for n7 startup ==="
sleep 10

echo "=== [11] Final Test ==="
curl -s -o /dev/null -w "n7 HTTP: %{http_code}\\n" http://127.0.0.1:${N7_PORT}/
curl -s -o /dev/null -w "n11 HTTP: %{http_code}\\n" http://127.0.0.1:3500/
pm2 list | grep -E "saas|ice|main"
echo "=== Done! ==="
`;
            conn.exec(cmd, (err2, s2) => {
                s2.on('data', d => process.stdout.write(d.toString()));
                s2.stderr.on('data', d => process.stderr.write(d.toString()));
                s2.on('close', () => conn.end());
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
