const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // الخطوة 1: إيقاف saas-app مؤقتاً ثم build
    conn.exec(`
pm2 stop saas-app
echo "=== ⏳ Running npm run build on saas-app ==="
cd /www/wwwroot/n11.namainvist.com && timeout 600 npm run build 2>&1 | tail -10
echo "=== 🔄 Restarting saas-app ==="
pm2 start saas-app
sleep 3
pm2 list
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
