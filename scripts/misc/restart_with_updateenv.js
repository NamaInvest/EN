const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(
        'cd /www/wwwroot/namainvist.com && pm2 restart main-site --update-env && sleep 5 && curl -s "http://127.0.0.1:3000/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs"',
        (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => conn.end());
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
