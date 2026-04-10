const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    // Check Nginx Proxy Cache
    c.exec('rm -rf /dev/shm/nginx-cache/* || true; rm -rf /www/server/nginx/proxy_cache_dir/* || true; nginx -s reload', (err, s) => {
        let o = '';
        s.on('data', d => o += d.toString());
        s.on('close', () => {
            console.log("Cleared Nginx Cache:\n", o);
            c.exec('sleep 2 && curl -s http://127.0.0.1:80/settings -H "Host: n11.namainvist.com" | grep -o ".\\{0,50\\}Hindi.\\{0,50\\}"', (err2, s2) => {
                let o2 = '';
                s2.on('data', d => o2 += d.toString());
                s2.on('close', () => {
                    console.log("HTTP NGINX RESPONSE:\n", o2 || "CLEAN!");
                    c.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
