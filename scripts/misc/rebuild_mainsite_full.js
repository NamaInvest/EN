const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('Building main-site with updated check-status...');
    conn.exec(
        'cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -8 && pm2 restart main-site && sleep 5 && curl -s "http://127.0.0.1:3000/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs" && echo ""',
        (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => {
                console.log('\n✅ Done!');
                conn.end();
            });
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
