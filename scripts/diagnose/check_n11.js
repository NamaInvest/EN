const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
pm2 logs saas-app --nostream --lines 20 2>/dev/null
echo "---status---"
pm2 show saas-app | grep -E "status|pid|restart"
echo "---curl---"
sleep 3
curl -s -o/dev/null -w "n11: %{http_code}\\n" http://127.0.0.1:3500/
`, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
