const { Client } = require('ssh2');
const conn = new Client();

const DOMAIN = 'namainvest';
const FULL_DOMAIN = `${DOMAIN}.namainvist.com`;
const PORT = 3013;

// Use the namainvist.com wildcard cert (covers *.namainvist.com)
const nginxConf = `server
{
    listen 80;
    listen 443 ssl http2 ;
    server_name ${FULL_DOMAIN};
location = /googlebe8c17f02d7742b4.html { 
    default_type text/html; 
    return 200 "google-site-verification: googlebe8c17f02d7742b4.html"; 
}
    index index.html index.htm default.htm default.html;
    # root /www/wwwroot/${FULL_DOMAIN};
    
    #CERT-APPLY-CHECK--START
    include /www/server/panel/vhost/nginx/well-known/${DOMAIN}.conf;
    #CERT-APPLY-CHECK--END
    #SSL-START SSL related configuration
    ssl_certificate    /www/server/panel/vhost/cert/namainvist.com/fullchain.pem;
    ssl_certificate_key    /www/server/panel/vhost/cert/namainvist.com/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_tickets on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000";
    error_page 497  https://$host$request_uri;
    #SSL-END
    
    #Files or directories forbidden to access
    location ~ ^/(\\\.user.ini|\\\.htaccess|\\\.git|\\\.svn|\\\.project|LICENSE|README.md|package.json|package-lock.json|\\\.env|node_modules) {
        return 404;
    }
    
    location /.well-known/ {
        root  /www/wwwroot/${FULL_DOMAIN};
    }

    location / {
        proxy_pass http://127.0.0.1:${PORT};
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
    
    access_log  /www/wwwlogs/${DOMAIN}.log;
    error_log  /www/wwwlogs/${DOMAIN}.error.log;
}
`;

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        // Check if wildcard cert (namainvist.com cert) covers subdomains
        conn.exec('ls /www/server/panel/vhost/cert/namainvist.com/', (err, s) => {
            let certFiles = '';
            s.on('data', d => certFiles += d.toString());
            s.on('close', () => {
                console.log('Cert files:', certFiles.trim());
                
                // Write the nginx conf
                const ws = sftp.createWriteStream(`/www/server/panel/vhost/nginx/${FULL_DOMAIN}.conf`);
                ws.write(nginxConf);
                ws.end();
                ws.on('close', () => {
                    console.log(`📝 ${FULL_DOMAIN}.conf written`);
                    // Create well-known conf
                    const wkCmd = `mkdir -p /www/server/panel/vhost/nginx/well-known && echo "# well-known" > /www/server/panel/vhost/nginx/well-known/${DOMAIN}.conf`;
                    conn.exec(wkCmd, (err, s2) => {
                        s2.resume();
                        s2.on('close', () => {
                            // Test syntax and reload
                            conn.exec('nginx -t 2>&1 && nginx -s reload && sleep 2 && curl -sk https://' + FULL_DOMAIN + '/api/health | head -50', (err, s3) => {
                                s3.on('data', d => process.stdout.write(d.toString()));
                                s3.stderr.on('data', d => process.stderr.write(d.toString()));
                                s3.on('close', () => conn.end());
                            });
                        });
                    });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
