const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- REWRITING NGINX PROXY BLOCK ---');
    
    // Overwrite namainvist.com.conf with a bulletproof reverse proxy config for port 2999
    const bashScript = `
#!/bin/bash
chattr -i /www/server/panel/vhost/nginx/namainvist.com.conf
cat << 'EOF' > /www/server/panel/vhost/nginx/namainvist.com.conf
server {
    listen 80;
    listen 443 ssl http2;
    server_name namainvist.com www.namainvist.com;
    
    ssl_certificate /www/server/panel/vhost/cert/namainvist.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/namainvist.com/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    error_page 497  https://$host$request_uri;

    location / {
        proxy_pass http://127.0.0.1:2999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
chattr +i /www/server/panel/vhost/nginx/namainvist.com.conf
/etc/init.d/nginx restart
curl -vI https://namainvist.com
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
