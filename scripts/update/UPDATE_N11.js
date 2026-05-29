const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
console.log('🚀 Connecting to Fleet Master Node (46.4.188.170)...');

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) {
            console.error('SFTP Error:', err);
            conn.end();
            return;
        }
        
        console.log('📤 Uploading updated translations.ts to n11...');
        const localFile = 'src/lib/translations.ts';
        const remoteFile = '/www/wwwroot/n11.namainvist.com/src/lib/translations.ts';
        
        sftp.fastPut(localFile, remoteFile, (uploadErr) => {
            if (uploadErr) {
                console.error('❌ Upload failed:', uploadErr);
                conn.end();
                return;
            }
            
            console.log('✅ Upload complete! Triggering remote Next.js build on N11...');
            const buildCmd = 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use 24 && cd /www/wwwroot/n11.namainvist.com && echo "🏗️ Running npm run build..." && npm run build && pm2 restart n11 && echo "🎉 RESTART FINISHED"';
            
            conn.exec(buildCmd, (err, stream) => {
                if (err) {
                    console.error('Execution Error:', err);
                    conn.end();
                    return;
                }
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', (code) => {
                    console.log(`\n✅ Remote script finished with exit code ${code}`);
                    conn.end();
                });
            });
        });
    });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
