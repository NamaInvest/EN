const { Client } = require('ssh2');
const conn = new Client();
const MASTER = '/www/wwwroot/n11.namainvist.com';
const SAAS_PORT = 3500;

conn.on('ready', () => {
    const cmd = [
        // Update .env to use port 3500
        `sed -i "s/PORT=.*/PORT=${SAAS_PORT}/" ${MASTER}/.env`,
        `echo "✅ PORT set to ${SAAS_PORT}"`,

        // Delete errored saas-app and restart with correct port
        `pm2 delete saas-app 2>/dev/null || true`,
        `pm2 start ${MASTER}/node_modules/next/dist/bin/next --name "saas-app" -- start -p ${SAAS_PORT}`,
        `pm2 save --force`,
        `echo "✅ saas-app started on port ${SAAS_PORT}"`,

        // Update nginx wildcard to use 3500
        `sed -i "s|proxy_pass.*http://127.0.0.1:[0-9]*|proxy_pass         http://127.0.0.1:${SAAS_PORT}|g" /www/server/panel/vhost/nginx/tenants-wildcard.namainvist.com.conf`,
        `echo "✅ Nginx updated to port ${SAAS_PORT}"`,

        // Reload nginx
        `/www/server/nginx/sbin/nginx -t -c /www/server/nginx/conf/nginx.conf 2>&1 && /www/server/nginx/sbin/nginx -s reload`,
        `echo "✅ Nginx reloaded"`,

        // Wait a moment for app to start
        `sleep 5`,

        // Test
        `echo "=== Testing ==="`,
        `curl -s -o /dev/null -w "HTTP %{http_code}" -H "Host: n11.namainvist.com" http://127.0.0.1:${SAAS_PORT}/ 2>/dev/null`,
        `echo ""`,
        `curl -s -H "Host: n11.namainvist.com" http://127.0.0.1:${SAAS_PORT}/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}' 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print('Login OK:', d.get('token','?')[:30])" 2>/dev/null || echo "API responded"`,
        `echo ""`,
        `pm2 list | grep -E "saas|main"`,
    ].join(' && ');

    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
