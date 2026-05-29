const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Test directly via internal port 3013 to bypass nginx
    const cmd = [
        // Test via internal port (bypass nginx cache)
        'curl -s -X POST http://127.0.0.1:3013/api/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin"}\'',
        'echo ---',
        // Check if port 3013 is really the namainvest app
        'pm2 show namainvest | grep -E "port|script|status"',
        'echo ---',
        // Direct DB check via psql
        'sudo -u postgres psql -d namainvest_db -c "SELECT id, username, role, active, LEFT(password_hash, 20) as hash_start FROM users LIMIT 5;" 2>&1 || sudo -u postgres psql -d namainvest_db -c "SELECT id, username, role, active FROM \\"User\\" LIMIT 5;" 2>&1'
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
