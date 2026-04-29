const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
console.log('🚀 Connecting to Fleet Master Node (46.4.188.170) to upload new i18n JSON Architecture...');

const filesToUpload = [
    { local: 'src/lib/translations.ts', remote: '/www/wwwroot/n11.namainvist.com/src/lib/translations.ts' },
    { local: 'src/lib/i18n.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/lib/i18n.tsx' },
    { local: 'src/lib/i18n_from_server.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/lib/i18n_from_server.tsx' },
    { local: 'src/locales/ar.json', remote: '/www/wwwroot/n11.namainvist.com/src/locales/ar.json' },
    { local: 'src/locales/en.json', remote: '/www/wwwroot/n11.namainvist.com/src/locales/en.json' },
    { local: 'src/locales/hi.json', remote: '/www/wwwroot/n11.namainvist.com/src/locales/hi.json' },
    { local: 'src/locales/ur.json', remote: '/www/wwwroot/n11.namainvist.com/src/locales/ur.json' },
    { local: 'src/locales/bn.json', remote: '/www/wwwroot/n11.namainvist.com/src/locales/bn.json' }
];

conn.on('ready', () => {
    // Make sure src/locales exists
    conn.exec('mkdir -p /www/wwwroot/n11.namainvist.com/src/locales', (err, stream) => {
        if (err) throw err;
        stream.resume(); // consume output so it closes
        stream.on('close', () => {
             startUpload();
        });
    });
    
    function startUpload() {
        conn.sftp((err, sftp) => {
            if (err) {
                console.error('SFTP Error:', err);
                conn.end();
                return;
            }
            
            let uploadedCount = 0;
            
            const uploadNext = () => {
                if (uploadedCount >= filesToUpload.length) {
                    console.log('✅ All translations and JSON compiled files uploaded successfully! Triggering remote Next.js build on N11...');
                    triggerBuild();
                    return;
                }
                
                const file = filesToUpload[uploadedCount];
                console.log(`📤 Uploading ${file.local}...`);
                sftp.fastPut(file.local, file.remote, (uploadErr) => {
                    if (uploadErr) {
                        console.error(`❌ Upload failed for ${file.local}:`, uploadErr);
                        conn.end();
                        return;
                    }
                    uploadedCount++;
                    uploadNext();
                });
            };
            
            uploadNext();
            
            const triggerBuild = () => {
                // Clear .next cache just to be absolutely sure all server components grab the latest JSON
                const buildCmd = 'cd /www/wwwroot/n11.namainvist.com && rm -rf .next/cache && npm run build && pm2 restart n11';
                
                conn.exec(buildCmd, (err, stream) => {
                    if (err) {
                        console.error('Execution Error:', err);
                        conn.end();
                        return;
                    }
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', (code) => {
                        console.log(`\n✅ Remote build finished with exit code ${code}`);
                        conn.end();
                    });
                });
            };
        });
    }
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
