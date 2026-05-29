const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ متصل - إصلاح proxy.conf...');
    const proxyFile = '/www/server/panel/vhost/nginx/proxy/namainvist.com/proxy.conf';

    const cmd = [
        // Fix the port in the proxy config
        `sed -i 's/127.0.0.1:2999/127.0.0.1:3000/g' ${proxyFile}`,
        // Verify the change
        `echo "=== AFTER FIX ==="`,
        `head -3 ${proxyFile}`,
        // Reload aaPanel nginx (NOT the system nginx)
        `/www/server/nginx/sbin/nginx -t 2>&1`,
        `/www/server/nginx/sbin/nginx -s reload && echo "AAPANEL_NGINX_RELOADED"`,
        // Test
        `sleep 2 && curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:80/ -H "Host: namainvist.com" && echo " <- port 80 via aaPanel nginx"`,
    ].join(' && ');

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('\n✅ اكتمل!');
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000
});
