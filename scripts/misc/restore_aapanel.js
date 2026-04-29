const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- PURGING CUSTOM NGINX BLOCK ---');
    
    const bashScript = `
#!/bin/bash
# Recreate the default AaPanel PHP config for namainvist.com
cat << 'EOF' > /www/server/panel/vhost/nginx/namainvist.com.conf
server
{
    listen 80;
    listen 443 ssl http2;
    server_name namainvist.com www.namainvist.com;
    index index.php index.html index.htm default.php default.htm default.html;
    root /www/wwwroot/namainvist.com;

    # SSL Certs
    ssl_certificate    /www/server/panel/vhost/cert/namainvist.com/fullchain.pem;
    ssl_certificate_key    /www/server/panel/vhost/cert/namainvist.com/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000";
    error_page 497  https://$host$request_uri;

    # ERROR-PAGE-START
    error_page 404 /404.html;
    error_page 502 /502.html;
    # ERROR-PAGE-END

    location ~ ^/(\\.user.ini|\\.htaccess|\\.git|\\.env|\\.svn|\\.project|LICENSE|README.md)
    {
        return 404;
    }

    location ~ \\.well-known{
        allow all;
    }
    
    location ~ .*\\.(gif|jpg|jpeg|png|bmp|swf)$
    {
        expires      30d;
        error_log /dev/null;
        access_log /dev/null;
    }
    
    location ~ .*\\.(js|css)?$
    {
        expires      12h;
        error_log /dev/null;
        access_log /dev/null; 
    }
    
    access_log  /www/wwwlogs/namainvist.com.log;
    error_log  /www/wwwlogs/namainvist.com.error.log;
}
EOF

# Restart Nginx
/etc/init.d/nginx reload || systemctl reload nginx
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('✅ CONFIG PURGED. READY FOR AAPANEL GUI.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
