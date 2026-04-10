const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    // Find nginx config for n11
    c.exec("cat /etc/nginx/sites-enabled/n11* 2>/dev/null || cat /etc/nginx/conf.d/n11* 2>/dev/null || ls /www/server/panel/vhost/nginx/ 2>/dev/null | grep n11", (err, s) => {
        let o = '';
        s.on('data', d => { o += d.toString(); });
        s.on('close', () => {
            console.log('Nginx config:', o.slice(0, 500));
            
            // Get ngnix config path for n11.namainvist.com
            c.exec("find /www -name '*.conf' 2>/dev/null | xargs grep -l 'n11.namainvist' 2>/dev/null | head -3", (err2, s2) => {
                let o2 = '';
                s2.on('data', d => { o2 += d.toString(); });
                s2.on('close', () => {
                    console.log('\nNginx conf files:', o2.trim());
                    c.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
