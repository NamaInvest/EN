const { Client } = require('ssh2');
const conn = new Client();
const MASTER = '/www/wwwroot/n11.namainvist.com';
const PORT = 3500;

conn.on('ready', () => {
    const cmd = [
        // Delete old failed process
        'pm2 delete saas-app 2>/dev/null || true',

        // Start with --cwd so PM2 knows where the .next is!
        `pm2 start ${MASTER}/node_modules/next/dist/bin/next \\`,
        `  --name "saas-app" \\`,
        `  --cwd ${MASTER} \\`,
        `  -- start -p ${PORT}`,

        'pm2 save --force',
        'echo "✅ saas-app started with correct CWD"',

        // Wait for startup
        'sleep 8',

        // Test
        'echo "=== Testing saas-app ==="',
        `curl -s -o /dev/null -w "HTTP %{http_code}\\n" -H "Host: n11.namainvist.com" http://127.0.0.1:${PORT}/ 2>/dev/null`,
        `curl -s -H "Host: n11.namainvist.com" http://127.0.0.1:${PORT}/api/auth/login \\`,
        `  -X POST -H "Content-Type: application/json" \\`,
        `  -d '{"username":"admin","password":"admin"}' 2>/dev/null | head -c 200`,
        'echo ""',

        // Show PM2 status
        'pm2 list | grep -E "ice|main|saas"',
    ].join('\n');

    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
