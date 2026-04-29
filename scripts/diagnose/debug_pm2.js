const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const script = `
        echo "=== NGINX CONFIG ==="
        cat /www/server/panel/vhost/nginx/namainvist.com.conf || echo "No nginx config"
        echo "=== PM2 INFO ==="
        pm2 jlist | grep '"name":"nama-main"' -A 5 -B 5
        echo "=== RESTARTING NGINX ==="
        systemctl restart nginx || service nginx restart
    `;
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        let output = "";
        stream.on('data', d => output += d.toString());
        stream.on('close', () => {
            console.log(output);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
