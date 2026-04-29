const { Client } = require('ssh2');

const confRaw = `server {
    listen 80;
    listen 443 ssl;
    server_name ice.namainvist.com;
    
    ssl_certificate /etc/ssl/namainvist/origin.crt;
    ssl_certificate_key /etc/ssl/namainvist/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location / {
        proxy_pass http://localhost:3012;
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

const bashCommand = `
cat << 'EOF' > /www/server/panel/vhost/nginx/ice.namainvist.com.conf
${confRaw}
EOF

nginx -t && nginx -s reload
`;

const conn = new Client();
conn.on('ready', () => {
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
    password: '_ee4SWbxLVfH9b'
});
