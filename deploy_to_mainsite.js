const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        // Upload updated check-status to main-site
        sftp.fastPut(
            'd:/namasoft9-3-main/src/app/api/tenant/check-status/route.ts',
            '/www/wwwroot/namainvist.com/src/app/api/tenant/check-status/route.ts',
            {},
            putErr => {
                if (putErr) { console.error('Failed check-status:', putErr.message); conn.end(); return; }
                console.log('✅ Uploaded check-status to main-site');

                // Also upload provision route to main-site
                sftp.fastPut(
                    'd:/namasoft9-3-main/src/app/api/tenant/provision/route.ts',
                    '/www/wwwroot/namainvist.com/src/app/api/tenant/provision/route.ts',
                    {},
                    putErr2 => {
                        if (putErr2) console.error('Failed provision:', putErr2.message);
                        else console.log('✅ Uploaded provision to main-site');

                        // Rebuild main-site and restart
                        console.log('\n🔨 Rebuilding main-site...');
                        conn.exec(
                            'cd /www/wwwroot/namainvist.com && npx prisma generate 2>/dev/null; npm run build 2>&1 | tail -15 && pm2 restart main-site && echo "✅ main-site restarted"',
                            (buildErr, stream) => {
                                stream.on('data', d => process.stdout.write(d.toString()));
                                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                                stream.on('close', () => conn.end());
                            }
                        );
                    }
                );
            }
        );
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
