const { Client } = require('ssh2');
const fs = require('fs');

const routeContent = fs.readFileSync('src/app/api/tenant/provision/route.ts', 'utf8');

const bashCommand = `
cat << 'EOF' > /www/wwwroot/namainvist.com/src/app/api/tenant/provision/route.ts
${routeContent}
EOF
cd /www/wwwroot/namainvist.com && npm run build > build_certs.log 2>&1 && pm2 restart nama-landing

cat > /etc/nginx/sites-available/ice.namainvist.com << 'EOF'
server {
    listen 80;
    listen 443 ssl http2;
    server_name ice.namainvist.com www.ice.namainvist.com;
    
    ssl_certificate /etc/ssl/namainvist/origin.crt;
    ssl_certificate_key /etc/ssl/namainvist/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:3012;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
    }
}
EOF
systemctl reload nginx
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Deploying route.ts and Nginx updates...');
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d))
              .on('error', (d) => process.stderr.write(d))
              .on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD'
});
