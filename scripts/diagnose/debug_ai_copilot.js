const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    const cmd = `
        cd /www/wwwroot/n11.namainvist.com
        sed -i 's/return NextResponse.json({ error: '\\''Internal Error'\\'' }, { status: 500 });/console.error("AI ERROR:", e); return NextResponse.json({ error: e.message || "\\\\u062E\\\\u0637\\\\u0623 \\\\u062F\\\\u0627\\\\u062E\\\\u0644\\\\u064A" }, { status: 500 });/g' src/app/api/ai/copilot/route.ts
        npm run build > /dev/null 2>&1
        pm2 restart nama-main
        echo "DEBUG APPLIED"
    `;
    c.exec(cmd, { env: { HOME: '/root', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v22.0.0/bin' } }, (e, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => c.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
