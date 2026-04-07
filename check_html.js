const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Get actual sidebar RSC/HTML from a pre-rendered page
    conn.exec(`
        grep -oa "المشتريات[^\"]{0,50}" /www/wwwroot/n2.namainvist.com/.next/server/app/loyalty.html 2>/dev/null | head -5
        echo "==="
        grep -oa "طلبات الشراء[^\"]{0,30}" /www/wwwroot/n2.namainvist.com/.next/server/app/loyalty.html 2>/dev/null | head -5
        echo "==="
        # Check aaPanel nginx proxy port
        grep "proxy_pass" /www/server/panel/vhost/nginx/n2.namainvist.com.conf 2>/dev/null
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
