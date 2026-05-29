const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
        echo "=== ALL PM2 PROCESSES ===" &&
        pm2 list &&
        echo "" &&
        echo "=== N2-MAIN DETAILS ===" &&
        pm2 show n2-main 2>/dev/null | grep -E "script|cwd|exec cwd|status|pid" &&
        echo "" &&
        echo "=== PORT 3001 PROCESS ===" &&
        ss -tlnp | grep 3001 &&
        echo "" &&
        echo "=== OTHER NAMASOFT DIRS ===" &&
        ls /www/wwwroot/ | grep -i n2 &&
        echo "" &&
        echo "=== NGINX CONFIG FOR N2 ===" &&
        cat /www/server/nginx/vhost/n2.namainvist.com.conf 2>/dev/null | grep -E "proxy_pass|root|listen" | head -10 &&
        echo "" &&
        echo "=== WHICH SIDEBAR IS BEING SERVED (from running app) ===" &&
        curl -s http://localhost:3001/dashboard 2>/dev/null | grep -o "المشتريات[^<]*" | head -3
    `, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
