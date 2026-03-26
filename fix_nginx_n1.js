const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const nginxConf = `server
{
    listen 80;
    listen 443 ssl http2 ;
    server_name n1.namainvist.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header REMOTE-HOST $remote_addr;
        proxy_no_cache 1;
        proxy_cache_bypass 1;
        add_header X-Cache $upstream_cache_status;

        proxy_connect_timeout 30s;
        proxy_read_timeout 86400s;
        proxy_send_timeout 30s;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    access_log  /www/wwwlogs/n1.log;
    error_log  /www/wwwlogs/n1.error.log;
}`;

    const script = `
cat << 'EOF' > /www/server/panel/vhost/nginx/n1.namainvist.com.conf
${nginxConf}
EOF
rm -f /www/server/panel/vhost/nginx/node_n1.conf
nginx -s reload
pm2 restart "nama-n1" || pm2 restart "n1-main" || echo "PM2 restart skipped"
`;

    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
