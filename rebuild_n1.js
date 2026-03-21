const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Initiating Memory-Safe Build for N1...');
    // We MUST stop n1 itself to free ~500MB RAM before Next.js build.
    const cmd = `pm2 stop n1 n9 n10 || true && cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1 n9 n10 || true`;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
            console.log('Rebuild N1 exited with code ' + code);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
