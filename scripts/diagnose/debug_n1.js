const { Client } = require('ssh2');

function checkCount() {
    const conn = new Client();
    conn.on('ready', () => {
        const cmd = `cd /www/wwwroot/n1.namainvist.com && npm run build > build_log.txt 2>&1`;
        conn.exec(cmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => conn.end());
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
}

checkCount();
