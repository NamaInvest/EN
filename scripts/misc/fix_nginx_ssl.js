const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to Cluster array. Fixing NGINX SSL config...');
    
    // Create the correct NGINX configuration block with SSL directives
    const configContent = `server
{
    listen 80;
    listen 443 ssl http2;
    server_name namainvist.com www.namainvist.com;
    index index.html index.htm default.htm default.html;
    root /www/wwwroot/namainvist.com;

    # SSL Configuration (Recovered from aaPanel Vault)
    ssl_certificate    /www/server/panel/vhost/cert/namainvist.com/fullchain.pem;
    ssl_certificate_key    /www/server/panel/vhost/cert/namainvist.com/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    error_page 497  https://$host$request_uri;

    # Strict Reverse Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
    }
}`;

    const cmd = `
        cat << 'EOF' > /www/server/panel/vhost/nginx/namainvist.com.conf
${configContent}
EOF
        nginx -t && nginx -s reload && echo "✅ NGINX SSL SUCCESSFULLY ROUTED AND RELOADED."
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'
});
