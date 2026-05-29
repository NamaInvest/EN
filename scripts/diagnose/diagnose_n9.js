const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmds = `
        echo "=== N9 PM2 LOGS ==="
        pm2 logs n9 --nostream --lines 50
        echo "=== N9 PRISMA SEED TEST ==="
        cd /www/wwwroot/n9.namainvist.com
        pwd
        npx tsx prisma/seed.ts
        echo "=== N9 .ENV FILE ==="
        cat .env
    `;
    conn.exec(cmds, (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log(out);
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    keepaliveInterval: 10000
});
