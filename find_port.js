const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
        pm2 show n2-main 2>/dev/null | grep -E "cwd|script|port|args" &&
        echo "--- PORT N2 IS ON ---" &&
        ss -tlnp 2>/dev/null | grep next &&
        echo "--- NGINX PROXY ---" &&
        find /www/server/nginx/vhost/ -name "*n2*" -exec cat {} \\; 2>/dev/null | grep -E "proxy_pass|listen" | head -10 &&
        echo "--- CURL TEST ---" &&
        curl -sv http://127.0.0.1:3001/ 2>&1 | grep -E "< HTTP|Location|Server" | head -5 &&
        echo "---" &&
        curl -sv http://127.0.0.1:3002/ 2>&1 | grep -E "< HTTP|Location|Server" | head -5
    `, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
