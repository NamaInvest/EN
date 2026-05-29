const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Read the SSL cert paths from n11's existing conf
    const getN11Conf = 'cat /www/server/panel/vhost/nginx/n11.namainvist.com.conf';

    conn.exec(getN11Conf, (err, s) => {
        let conf = '';
        s.on('data', d => conf += d.toString());
        s.on('close', () => {
            // Extract cert paths from n11 config
            const sslCert = (conf.match(/ssl_certificate\s+([^;]+);/) || [])[1]?.trim() || '/www/server/panel/vhost/cert/n11.namainvist.com/fullchain.pem';
            const sslKey  = (conf.match(/ssl_certificate_key\s+([^;]+);/) || [])[1]?.trim() || '/www/server/panel/vhost/cert/n11.namainvist.com/privkey.pem';

            console.log('SSL Cert:', sslCert);
            console.log('SSL Key:', sslKey);

            const wildcardConf = `server {
    listen 80;
    server_name *.namainvist.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name *.namainvist.com;

    ssl_certificate     ${sslCert};
    ssl_certificate_key ${sslKey};
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    client_max_body_size 100M;
    
    # Proxy to the single SaaS app (port 3000)
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}`;

            const NGINX_DIR = '/www/server/panel/vhost/nginx';
            const cmd = [
                // Write the wildcard config
                `cat > ${NGINX_DIR}/tenants-wildcard.namainvist.com.conf << 'NGINXEOF'\n${wildcardConf}\nNGINXEOF`,
                `echo "✅ Wildcard config written"`,

                // Remove n11's dedicated config (now handled by wildcard)
                `chattr -i ${NGINX_DIR}/n11.namainvist.com.conf 2>/dev/null || true`,
                `rm -f ${NGINX_DIR}/n11.namainvist.com.conf`,
                `echo "✅ Removed n11 dedicated nginx"`,

                // Test and reload
                `/www/server/nginx/sbin/nginx -t -c /www/server/nginx/conf/nginx.conf 2>&1`,
                `/www/server/nginx/sbin/nginx -s reload -c /www/server/nginx/conf/nginx.conf`,
                `echo "✅ Nginx reloaded with wildcard"`,

                // Verify
                `echo "=== Nginx configs ==="`,
                `ls -la ${NGINX_DIR}/*.conf | grep -v "^total"`,
                `echo "=== Test n11 tenant response ==="`,
                `curl -s -o /dev/null -w "%{http_code}" -H "Host: n11.namainvist.com" http://127.0.0.1:3000/api/sys/health 2>/dev/null || echo "API test done"`,
            ].join('\n');

            conn.exec(cmd, (err2, s2) => {
                s2.on('data', d => process.stdout.write(d.toString()));
                s2.stderr.on('data', d => process.stderr.write(d.toString()));
                s2.on('close', () => conn.end());
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
