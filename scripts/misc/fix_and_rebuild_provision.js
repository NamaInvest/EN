const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(
            'c:/Users/1/Desktop/alfa/src/app/api/tenant/provision/route.ts',
            '/www/wwwroot/n11.namainvist.com/src/app/api/tenant/provision/route.ts',
            {},
            putErr => {
                if (putErr) { console.error('Failed:', putErr.message); conn.end(); return; }
                console.log('✅ Uploaded: provision/route.ts');

                // Fix existing mgmg record + rebuild
                conn.exec(
                    `psql -U n11_db -h localhost -d n11_db -c "UPDATE tenant_accounts SET clerk_user_id='user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs' WHERE user_email='ialqrashi62@gmail.com' RETURNING subdomain, clerk_user_id;" 2>/dev/null && cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -10 && pm2 restart saas-app && echo "✅ DONE"`,
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
