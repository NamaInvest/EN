const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== FULL Main-site .env (Clerk lines) ==="
grep -i "clerk\\|sign_in\\|sign_up\\|after\\|redirect\\|dashboard\\|company" /www/wwwroot/namainvist.com/.env 2>/dev/null
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
