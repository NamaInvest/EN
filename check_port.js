const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ متصل - إصلاح proxy config...');
    const cmd = [
        `echo "=== proxy configs ==="`,
        `ls /www/server/panel/vhost/nginx/proxy/namainvist.com/ 2>/dev/null`,
        `cat /www/server/panel/vhost/nginx/proxy/namainvist.com/*.conf 2>/dev/null`,
    ].join(' && ');

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { conn.end(); });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000
});
