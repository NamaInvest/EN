const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const cmds = [
        'pm2 describe saas-app 2>/dev/null | grep -i cwd',
        'pm2 describe saas-app 2>/dev/null | grep -i script',
        'echo "---"',
        'ls /www/wwwroot/n1.namainvist.com/src/app/restaurant-pos/ 2>/dev/null || echo "N1: NO restaurant-pos"',
        'ls /www/wwwroot/namainvist.com/src/app/restaurant-pos/ 2>/dev/null || echo "MAIN: NO restaurant-pos"',
        'echo "---NGINX---"',
        'grep -r "ahmedalyami" /www/server/panel/vhost/nginx/ 2>/dev/null || echo "No nginx config for ahmedalyami"',
        'grep -r "shippy" /www/server/panel/vhost/nginx/ 2>/dev/null || echo "No nginx config for shippy"'
    ].join(' && ');
    
    conn.exec(cmds, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000
});
