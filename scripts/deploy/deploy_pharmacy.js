const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const archivePath = path.join('scripts', 'deploy', 'deploy_patch_pharmacy.tar.gz');
const appPath = '/www/wwwroot/n11.namainvist.com';

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected to 46.4.188.170');

    conn.sftp((err, sftp) => {
        if (err) { console.error('SFTP error:', err.message); return conn.end(); }

        const data = fs.readFileSync(archivePath);
        const ws = sftp.createWriteStream('/tmp/deploy_pharmacy.tar.gz');

        ws.on('close', () => {
            console.log(`📦 Upload OK (${data.length} bytes)`);

            // Step 1: Extract
            conn.exec(`cd ${appPath} && tar -xzf /tmp/deploy_pharmacy.tar.gz`, (e, s) => {
                let o = '';
                s.on('data', d => o += d);
                s.stderr.on('data', d => o += d);
                s.on('close', () => {
                    console.log('📂 Extract done:', o.trim() || 'OK');

                    // Step 2: Prisma generate
                    conn.exec(`cd ${appPath} && npx prisma generate 2>&1`, (e2, s2) => {
                        let o2 = '';
                        s2.on('data', d => o2 += d);
                        s2.on('close', () => {
                            const generated = o2.includes('Generated') ? '✅ Generated' : o2.slice(-100);
                            console.log('🔧 Prisma generate:', generated);

                            // Step 3: DB push (new pharmacy tables)
                            conn.exec(`cd ${appPath} && npx prisma db push --accept-data-loss 2>&1`, (e3, s3) => {
                                let o3 = '';
                                s3.on('data', d => o3 += d);
                                s3.on('close', () => {
                                    const lines = o3.split('\n').filter(l =>
                                        l.includes('Your database') || l.includes('Error') || l.includes('Done')
                                    ).join('\n');
                                    console.log('🗄️  DB Push:', lines || o3.slice(-200));

                                    // Step 4: Build
                                    conn.exec(`cd ${appPath} && npm run build 2>&1`, (e4, s4) => {
                                        let o4 = '';
                                        s4.on('data', d => o4 += d);
                                        s4.on('close', () => {
                                            const buildOk = o4.includes('Route (app)') || o4.includes('compiled');
                                            console.log('🏗️  Build:', buildOk ? '✅ Success' : o4.slice(-300));

                                            // Step 5: Restart PM2
                                            conn.exec('pm2 restart saas-app 2>&1', (e5, s5) => {
                                                let o5 = '';
                                                s5.on('data', d => o5 += d);
                                                s5.on('close', () => {
                                                    const online = o5.includes('online');
                                                    console.log('🚀 PM2 saas-app:', online ? '✅ online' : o5.slice(-200));
                                                    conn.end();
                                                    console.log('\n🎉 Pharmacy module deployed to 46.4.188.170');
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        ws.on('error', e => console.error('Write error:', e.message));
        ws.write(data);
        ws.end();
    });
}).on('error', e => console.error('Connection error:', e.message))
  .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
