const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const BASE = '/www/wwwroot/n3.namainvist.com';

conn.on('ready', () => {
    console.log('✅ Connected to N3. Starting FULL clean deploy...\n');

    // Step 1: Upload ALL source files
    conn.sftp((err, sftp) => {
        if (err) { console.error('SFTP error:', err); conn.end(); return; }

        const files = [
            'src/lib/i18n.tsx',
            'src/app/layout.tsx',
            'src/app/(dashboard)/layout.tsx',
            'src/components/Providers.tsx',
            'src/components/Sidebar.tsx',
            'src/components/LanguageSwitcher.tsx',
            'src/app/(dashboard)/dashboard/page.tsx',
        ];

        let uploaded = 0;
        console.log(`Uploading ${files.length} files...`);

        files.forEach(f => {
            const localPath = f;
            const remotePath = `${BASE}/${f}`;
            
            if (!fs.existsSync(localPath)) {
                console.log(`⚠️ SKIP (not found locally): ${f}`);
                uploaded++;
                checkDone();
                return;
            }

            sftp.fastPut(localPath, remotePath, (err) => {
                if (err) console.log(`❌ ${f}: ${err.message}`);
                else console.log(`📦 ${f}`);
                uploaded++;
                checkDone();
            });
        });

        function checkDone() {
            if (uploaded < files.length) return;
            
            console.log('\n🧹 Cleaning .next cache and rebuilding...');
            
            // Clean build: remove .next, rebuild, restart
            const buildCmd = `cd ${BASE} && rm -rf .next && npm run build 2>&1 | tail -20 && pm2 restart n3 2>&1 | head -5 && echo DEPLOY_SUCCESS`;
            
            conn.exec(buildCmd, (err, stream) => {
                if (err) { console.error('Exec error:', err); conn.end(); return; }
                
                let output = '';
                const timeout = setTimeout(() => {
                    console.log('⏰ Build timeout after 180s');
                    conn.end();
                }, 180000);

                stream.on('data', d => {
                    const text = d.toString();
                    output += text;
                    process.stdout.write(text);
                });
                stream.stderr.on('data', d => process.stderr.write(d));
                stream.on('close', () => {
                    clearTimeout(timeout);
                    console.log('\n');
                    if (output.includes('DEPLOY_SUCCESS')) {
                        console.log('🎉 N3 CLEAN DEPLOY COMPLETE!');
                    } else {
                        console.log('❌ Build may have failed. Check output above.');
                    }
                    conn.end();
                });
            });
        }
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
