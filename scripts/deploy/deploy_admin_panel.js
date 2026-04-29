const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const filesToUpload = [
    'src/app/login/page.tsx',
    'src/app/auth/routing/page.tsx',
    'src/app/api/auth/[...nextauth]/route.ts',
    'src/app/api/tenant/create/route.ts',
    'src/app/api/tenant/status/route.ts',
    'src/app/onboarding/zatca/page.tsx',
    'src/app/admin/saas/page.tsx',
    'src/app/api/admin/nodes/route.ts',
    'src/app/api/admin/nodes/sync/route.ts',
    'src/components/Providers.tsx',
    'src/app/layout.tsx',
    'src/app/api/settings/zatca-onboard/route.ts',
    'src/lib/i18n.tsx',
    'src/app/api/settings/generate-keys/route.ts',
    'src/app/api/zatca/route.ts',
    'src/app/api/zatca/qr/route.ts'
];

conn.on('ready', () => {
    console.log('--- CONNECTED. PUSHING ADMIN PANEL COMPONENTS ---');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let uploaded = 0;
        
        const uploadNext = () => {
            if (uploaded >= filesToUpload.length) {
                console.log('✅ ALL SFTP UPLOADS COMPLETE! TRIGGERING BUILD...');
                const bashScript = `
cd /www/wwwroot/namainvist.com
npm install next-auth zatca-xml-js qrcode --legacy-peer-deps
npm run build
pm2 restart nama-main
                `;
                conn.exec(bashScript, (execErr, stream) => {
                    if (execErr) throw execErr;
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => {
                        console.log('✅ HETZNER BUILD COMPLETE.');
                        conn.end();
                    });
                });
                return;
            }
            
            const relPath = filesToUpload[uploaded];
            const localFile = path.join(__dirname, relPath);
            const remoteFile = '/www/wwwroot/namainvist.com/' + relPath;
            const remoteDir = path.dirname(remoteFile);
            
            // Ensure remote directory exists
            conn.exec('mkdir -p "' + remoteDir + '"', (dirErr) => {
                if(dirErr) console.warn(dirErr);
                sftp.fastPut(localFile, remoteFile, (putErr) => {
                    if (putErr) throw putErr;
                    console.log('✅ Pushed: ' + relPath);
                    uploaded++;
                    uploadNext();
                });
            });
        };
        
        uploadNext();
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
