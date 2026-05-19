const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('echo "GEMINI_API_KEY=\\"AIzaSyB4BVY3zYISpPIPA3zX7u9NfkY8ZF3yRDE\\"" >> /www/wwwroot/namainvist.com/.env.production && pm2 restart main-site n1-main saas-app', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => console.log(d.toString())).on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
