const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Generate a valid JWT token to pass the session guard and reach the dashboard
    // Actually, Next.js prerenders the dashboard anyway, we can just grab the static HTML
    conn.exec(`
        echo "=== HTML ON DISK ==="
        cat /www/wwwroot/n2.namainvist.com/.next/server/app/\\(dashboard\\)/dashboard.html 2>/dev/null | grep -o "المشتريات[^<]*" | head -5
        echo "=== HTML FROM APP ==="
        wget -qO- --header="Cookie: token=fake_token" http://127.0.0.1:3002/dashboard | grep -o "المشتريات[^<]*" | head -5
        echo "=== PROCESSES RUNNING OUT OF THE DIR ==="
        lsof +d /www/wwwroot/n2.namainvist.com/ | grep node | head -5
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
