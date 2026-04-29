const { Client } = require('ssh2');
const conn = new Client();

const DOMAIN = 'namainvest.namainvist.com';
const PORT = 3013;

// Cloudflare handles SSL, origin uses HTTP only
// But we need SSL on origin since Cloudflare Full mode requires it
// Use n1's cert as a workaround (Cloudflare accepts any cert in Full mode)
const nginxConf = `server
{
    listen 80;
    listen 443 ssl http2;
    server_name ${DOMAIN};

    #SSL - use n1 cert temporarily (Cloudflare proxies SSL)
    ssl_certificate    /www/server/panel/vhost/cert/n1/fullchain.pem;
    ssl_certificate_key    /www/server/panel/vhost/cert/n1/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    error_page 497  https://$host$request_uri;

    location ~ ^/(\\\.user.ini|\\\.htaccess|\\\.git|\\\.env|node_modules) {
        return 404;
    }

    location /.well-known/ {
        root  /www/wwwroot/${DOMAIN};
    }

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header REMOTE-HOST $remote_addr;
        proxy_no_cache 1;
        proxy_cache_bypass 1;
        proxy_connect_timeout 30s;
        proxy_read_timeout 86400s;
        proxy_send_timeout 30s;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    access_log  /www/wwwlogs/namainvest.log;
    error_log  /www/wwwlogs/namainvest.error.log;
}
`;

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        const ws = sftp.createWriteStream(`/www/server/panel/vhost/nginx/${DOMAIN}.conf`);
        ws.write(nginxConf);
        ws.end();
        ws.on('close', () => {
            console.log('📝 nginx conf written (using n1 cert as workaround)');
            conn.exec('nginx -t 2>&1 && nginx -s reload && echo RELOADED && sleep 2 && curl -sk -X POST https://' + DOMAIN + '/api/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin"}\' | head -200', (err, s) => {
                s.on('data', d => process.stdout.write(d.toString()));
                s.stderr.on('data', d => process.stderr.write(d.toString()));
                s.on('close', () => conn.end());
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
