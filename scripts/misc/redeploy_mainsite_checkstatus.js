const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(
            'c:/Users/1/Desktop/alfa/src/app/api/tenant/check-status/route.ts',
            '/www/wwwroot/namainvist.com/src/app/api/tenant/check-status/route.ts',
            {},
            putErr => {
                if (putErr) { console.error('Failed:', putErr.message); conn.end(); return; }
                console.log('✅ Uploaded check-status to main-site');
                console.log('🔨 Rebuilding main-site...');
                conn.exec(
                    'cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -10 && pm2 restart main-site && sleep 4 && echo "=== Final test ===" && curl -s "http://127.0.0.1:3000/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs" 2>/dev/null && echo "✅ DONE"',
                    (buildErr, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream.on('close', () => conn.end());
                    }
                );
            }
        );
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
