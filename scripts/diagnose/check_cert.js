const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        // Check if cert is wildcard
        'openssl x509 -in /www/server/panel/vhost/cert/namainvist.com/fullchain.pem -noout -text | grep -E "DNS:|Subject:"',
        'echo ---main nginx conf---',
        'cat /www/server/panel/vhost/nginx/namainvist.com.conf | grep -E "server_name|proxy_pass|proxy|include" | head -20',
        'echo ---n1 cert---',
        'openssl x509 -in /www/server/panel/vhost/cert/n1/fullchain.pem -noout -text 2>/dev/null | grep -E "DNS:|Subject:"',
        'echo ---namainvest existing conf before mine---',
        'cat /www/server/panel/vhost/nginx/namainvest.namainvist.com.conf 2>/dev/null | grep -E "ssl_cert|proxy_pass|listen" | head -10',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
