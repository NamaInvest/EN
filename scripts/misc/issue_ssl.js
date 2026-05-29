const { Client } = require('ssh2');
const conn = new Client();

const DOMAIN = 'namainvest.namainvist.com';

conn.on('ready', () => {
    // Check available SSL tools on the server
    const cmd = [
        // Fix well-known conf for HTTP challenge
        'mkdir -p /www/server/panel/vhost/nginx/well-known',
        'echo "location /.well-known/ { root /www/wwwroot/' + DOMAIN + '; }" > /www/server/panel/vhost/nginx/well-known/namainvest.conf',
        'nginx -s reload',
        // Try acme.sh (aaPanel tool) first
        'ls ~/.acme.sh/acme.sh 2>/dev/null && echo ACME_FOUND || echo NO_ACME',
        // If acme.sh exists, issue cert
        'ls ~/.acme.sh/acme.sh 2>/dev/null && ~/.acme.sh/acme.sh --issue -d ' + DOMAIN + ' -w /www/wwwroot/' + DOMAIN + ' 2>&1 | tail -10 || certbot certonly --webroot -w /www/wwwroot/' + DOMAIN + ' -d ' + DOMAIN + ' --non-interactive --agree-tos --email admin@namainvist.com 2>&1 | tail -10',
    ].join(' && ');
    
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
