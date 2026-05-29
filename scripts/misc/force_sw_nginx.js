const { Client } = require('ssh2');

const config = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 60000 };

const newConf = `
#PROXY-START/
location ~* (sw\\.js|service-worker\\.js|workbox-.*\\.js|manifest\\.json)$ {
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    add_header Clear-Site-Data '\\"cache\\", \\"storage\\", \\"executionContexts\\"' always;
    proxy_pass http://127.0.0.1:2999;
}

location / {
    proxy_pass http://127.0.0.1:2999;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header REMOTE-HOST $remote_addr;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_http_version 1.1;

    proxy_hide_header Cache-Control;
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    # DO NOT send Clear-Site-Data to the root html, otherwise users get logged out constantly!
}
#PROXY-END/
`;

const conn = new Client();
conn.on('ready', () => {
    const safeConf = newConf.replace(/'/g, "'\\\\''");
    conn.exec("echo '" + safeConf + "' > /www/server/panel/vhost/nginx/proxy/namainvist.com/custom.conf && nginx -s reload", (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('NGINX completely purged cache rules AND sw.js explicit destroyer!');
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
