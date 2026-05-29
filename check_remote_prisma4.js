const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('sed -n "70,110p" /www/wwwroot/namainvist.com/src/lib/prisma.ts', (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
});
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
