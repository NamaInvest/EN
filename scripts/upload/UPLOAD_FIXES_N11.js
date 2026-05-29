const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
console.log('🚀 Connecting to Fleet Master Node (46.4.188.170)...');

const filesToUpload = [
    { local: 'src/app/pos/page.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/app/pos/page.tsx' },
    { local: 'src/app/restaurant-pos/page.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/app/restaurant-pos/page.tsx' },
    { local: 'src/app/(dashboard)/shifts/page.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/shifts/page.tsx' },
    { local: 'src/app/api/shifts/route.ts', remote: '/www/wwwroot/n11.namainvist.com/src/app/api/shifts/route.ts' },
    { local: 'src/app/(dashboard)/customers/page.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/customers/page.tsx' },
    { local: 'src/app/globals.css', remote: '/www/wwwroot/n11.namainvist.com/src/app/globals.css' },
    { local: 'src/lib/translations.ts', remote: '/www/wwwroot/n11.namainvist.com/src/lib/translations.ts' },
    { local: 'src/lib/i18n.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/lib/i18n.tsx' },
    { local: 'src/lib/i18n_from_server.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/lib/i18n_from_server.tsx' },
    { local: 'mcp_server/index.js', remote: '/root/mcp_server/index.js' }
];

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) {
            console.error('SFTP Error:', err);
            conn.end();
            return;
        }
        
        let uploadedCount = 0;
        
        const uploadNext = () => {
            if (uploadedCount >= filesToUpload.length) {
                console.log('✅ All files uploaded successfully! Triggering remote Next.js build on N11...');
                triggerBuild();
                return;
            }
            
            const file = filesToUpload[uploadedCount];
            console.log(`📤 Uploading ${file.local} to ${file.remote}...`);
            sftp.fastPut(file.local, file.remote, (uploadErr) => {
                if (uploadErr) {
                    // Try without /root directory if the mcp_server is in normal wwwroot, though mcp is likely a separate folder
                    if (file.local === 'mcp_server/index.js') {
                         console.warn('⚠️ MCP Server upload failed, skipping (might not exist on remote).');
                         uploadedCount++;
                         uploadNext();
                         return;
                    }
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
            const buildCmd = 'cd /www/wwwroot/n11.namainvist.com && source ~/.bashrc 2>/dev/null; echo "🏗️ Building..." && npm run build && echo "🔄 Restarting..." && pm2 restart n11 && echo "🎉 DONE"';
            
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
        };
    });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
