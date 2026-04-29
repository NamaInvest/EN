const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to Cluster Node Array (46.4.188.170)');
    
    // We will only target n1.namainvist.com and namainvist.com right now to get the user back online FAST!
    const cmd = `
        # Fix n1 compilation
        cd /www/wwwroot/n1.namainvist.com &&
        npm install &&
        npm run build &&
        pm2 restart n1 --update-env &&
        echo "✅ n1 IS ONLINE!" &&

        # Fix root domain compilation
        rm -rf /www/wwwroot/namainvist.com/* &&
        cp -R /www/wwwroot/n1.namainvist.com/* /www/wwwroot/namainvist.com/ &&
        cp -a /www/wwwroot/n1.namainvist.com/.next /www/wwwroot/namainvist.com/ || true &&
        cd /www/wwwroot/namainvist.com &&
        pm2 delete namainvist_root || true &&
        PORT=3000 pm2 start npm --name "namainvist_root" -- start &&
        
        # Make sure Nginx has the exact proxy
        cat << 'EOF' > /www/server/panel/vhost/nginx/namainvist.com.conf
server
{
    listen 80;
    listen 443 ssl http2;
    server_name namainvist.com www.namainvist.com;
    index index.html index.htm default.htm default.html;
    root /www/wwwroot/namainvist.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
    }
}
EOF
        nginx -s reload &&
        echo "✅ ROOT DOMAIN IS ONLINE!"
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
