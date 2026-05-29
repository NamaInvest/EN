const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
        echo "=== SIDEBAR TOP (first 10 lines) ===" &&
        head -10 /www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx &&
        echo "=== GL function present? ===" &&
        grep -c "function gl" /www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx &&
        echo "=== s.dashboard in menuItems? ===" &&
        grep -c "sk: 's.dashboard'" /www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx &&
        echo "=== Old hardcoded Arabic? ===" &&
        grep -c "سجل الفواتير السابقة" /www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx &&
        echo "=== PM2 start script ===" &&
        pm2 show n2-main | grep "script\|cwd\|exec" | head -5 &&
        echo "=== BUILT JS has gl function? ===" &&
        grep -l "function gl" /www/wwwroot/n2.namainvist.com/.next/server/chunks/ssr/*.js 2>/dev/null | head -3
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
