const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        // Upload updated next.config.ts
        sftp.fastPut(
            'd:/namasoft9-3-main/next.config.ts',
            '/www/wwwroot/n11.namainvist.com/next.config.ts',
            {},
            putErr => {
                if (putErr) console.error('Failed:', putErr.message);
                else console.log('✅ Uploaded: next.config.ts');
                
                // Install nodemailer then rebuild
                console.log('📦 Installing nodemailer + rebuilding...');
                conn.exec(
                    'cd /www/wwwroot/n11.namainvist.com && npm install nodemailer --save 2>&1 | tail -5 && npm run build 2>&1 | tail -40 && pm2 start ecosystem.config.js --only saas-app 2>/dev/null || pm2 restart 25 2>/dev/null || pm2 start npm --name saas-app -- start 2>/dev/null; pm2 list && echo "✅ SAAS_APP_DONE"',
                    (buildErr, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream.on('close', () => { conn.end(); });
                    }
                );
            }
        );
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
