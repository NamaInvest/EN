const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        // Upload check-status + provision + schema
        const files = [
            ['d:/namasoft9-3-main/src/app/api/tenant/check-status/route.ts', '/www/wwwroot/n11.namainvist.com/src/app/api/tenant/check-status/route.ts'],
            ['d:/namasoft9-3-main/src/app/api/tenant/provision/route.ts', '/www/wwwroot/n11.namainvist.com/src/app/api/tenant/provision/route.ts'],
            ['d:/namasoft9-3-main/prisma/schema.prisma', '/www/wwwroot/n11.namainvist.com/prisma/schema.prisma'],
        ];
        
        let uploaded = 0;
        const uploadNext = (idx) => {
            if (idx >= files.length) {
                console.log(`\n✅ Uploaded ${uploaded} files`);
                // Build and restart
                console.log('🔨 Building...');
                conn.exec(
                    'cd /www/wwwroot/n11.namainvist.com && npx prisma generate && npm run build 2>&1 | tail -20 && pm2 restart saas-app && echo "✅ DONE"',
                    (buildErr, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream.on('close', () => { conn.end(); });
                    }
                );
                return;
            }
            
            const [local, remote] = files[idx];
            sftp.fastPut(local, remote, {}, putErr => {
                if (putErr) console.error(`❌ Failed: ${local} — ${putErr.message}`);
                else { uploaded++; console.log(`✅ ${remote.split('/').pop()}`); }
                uploadNext(idx + 1);
            });
        };
        
        uploadNext(0);
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
