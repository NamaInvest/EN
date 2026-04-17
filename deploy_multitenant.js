const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
const MASTER = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }

        // Upload new prisma.ts
        sftp.fastPut(
            'd:/namasoft9-3-main/src/lib/prisma.ts',
            `${MASTER}/src/lib/prisma.ts`,
            {},
            (uploadErr) => {
                if (uploadErr) { console.error('Upload error:', uploadErr); conn.end(); return; }
                console.log('✅ Uploaded prisma.ts');

                // Build + change to port 3000 + restart as new name
                const cmd = [
                    `cd ${MASTER}`,

                    // Update PORT in .env to 3000
                    'sed -i "s/PORT=.*/PORT=3000/" .env',
                    // Set DEFAULT_TENANT=n11 (fallback)
                    'grep -q DEFAULT_TENANT .env || echo "DEFAULT_TENANT=n11" >> .env',
                    'echo "✅ .env updated"',

                    // Build
                    'echo "🔨 Building..."',
                    'npm run build 2>&1 | tail -5',

                    // Delete old n11 PM2 process
                    'pm2 delete n11 2>/dev/null || true',

                    // Start as saas-app on port 3000
                    `pm2 start ${MASTER}/node_modules/next/dist/bin/next --name "saas-app" -- start -p 3000`,
                    'pm2 save --force',
                    'echo "✅ PM2 saas-app started on port 3000"',
                    'pm2 list',
                ].join(' && ');

                conn.exec(cmd, (execErr, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => {
                        console.log('\n✅ Phase 2 step 1 done!');
                        conn.end();
                    });
                });
            }
        );
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
