const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== قطع الاتصالات عن namainvest_db ثم حذفها ==="
psql -U n11_db -h localhost -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'namainvest_db' AND pid <> pg_backend_pid();
" 2>/dev/null

sleep 1
psql -U n11_db -h localhost -c "DROP DATABASE IF EXISTS namainvest_db;" 2>&1

psql -U n11_db -h localhost -t -c "SELECT datname FROM pg_database WHERE datname='namainvest_db';" 2>/dev/null | grep -q namainvest && echo "❌ لا يزال موجود" || echo "✅ namainvest_db محذوفة نهائياً"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
