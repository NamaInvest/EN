const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = [
        // Show full nginx config for N3
        'echo "=== FULL NGINX CONFIG FOR N3 ==="',
        'cat /www/server/panel/vhost/nginx/n3.namainvist.com.conf',
    ].join(' && ');

    conn.exec(cmds, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => {});
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
