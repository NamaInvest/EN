const { Client } = require('ssh2');
const conn = new Client();

// Check the actual NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY being used on all nodes
const cmd = [
    'echo "=== main-site ==="',
    'grep CLERK_PUBLISHABLE /www/wwwroot/namainvist.com/.env 2>/dev/null | head -1',
    'echo "=== n1 ==="',
    'grep CLERK_PUBLISHABLE /www/wwwroot/n1.namainvist.com/.env 2>/dev/null | head -1',
    'echo "=== n11 ==="',
    'grep CLERK_PUBLISHABLE /www/wwwroot/n11.namainvist.com/.env 2>/dev/null | head -1',
    'echo "=== middleware check ==="',
    'grep -i "allowedOrigins\\|redirectOrigin\\|clerk" /www/wwwroot/namainvist.com/middleware.ts 2>/dev/null | head -10',
].join(' && ');

conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => {});
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
