const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
        echo "=== SIDEBAR CHECK ===" &&
        grep -c "getLabel" /www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx &&
        grep -c "طلبات الشراء الداخلية" /www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx &&
        grep -c "s.purchases" /www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx &&
        echo "=== PM2 INFO ===" &&
        pm2 list | grep n2 &&
        echo "=== BUILT JS CHECK ===" &&
        ls -lt /www/wwwroot/n2.namainvist.com/.next/server/chunks/ssr/ | head -5
    `, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
