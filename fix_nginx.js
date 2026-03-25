const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // 1. Delete index.html
    // 2. Clone the codebase from n1.namainvist.com to avoid a slow upload
    // 3. Prepare the PM2 proxy
    const cmd = `
        rm -f /www/wwwroot/namainvist.com/index.html && 
        echo "Copying from n1 to root domain..." && 
        cp -a /www/wwwroot/n1.namainvist.com/. /www/wwwroot/namainvist.com/ && 
        cd /www/wwwroot/namainvist.com && 
        echo "Building Root Domain..." && 
        npm install &&
        npm run build && 
        pm2 delete namainvist_root || true && 
        PORT=3000 pm2 start npm --name "namainvist_root" -- start &&
        echo "Configuring NGINX Reverse Proxy for namainvist.com" &&
        cat << 'EOF' > /www/server/panel/vhost/nginx/namainvist.com.conf
server
{
    listen 80;
    listen 443 ssl http2;
    server_name namainvist.com www.namainvist.com;
    index index.html index.htm default.htm default.html;
    root /www/wwwroot/namainvist.com;

    # SSL Config placeholder (AaPanel will manage certs)
    # ssl_certificate    /www/server/panel/vhost/cert/namainvist.com/fullchain.pem;
    # ssl_certificate_key    /www/server/panel/vhost/cert/namainvist.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    access_log  /www/wwwlogs/namainvist.com.log;
    error_log  /www/wwwlogs/namainvist.com.error.log;
}
EOF
        nginx -s reload && echo "SUCCESS!"
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
