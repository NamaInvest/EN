const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const FILES_TO_UPLOAD = [
    { local: 'src/app/api/ice/tenants/route.ts',         remote: '/www/wwwroot/n1.namainvist.com/src/app/api/ice/tenants/route.ts' },
    { local: 'src/app/api/ice/toggle/route.ts',          remote: '/www/wwwroot/n1.namainvist.com/src/app/api/ice/toggle/route.ts' },
    { local: 'src/app/ice/page.tsx',                     remote: '/www/wwwroot/n1.namainvist.com/src/app/ice/page.tsx' },
    { local: 'src/middleware.ts',                         remote: '/www/wwwroot/n1.namainvist.com/src/middleware.ts' },
    { local: 'src/components/Sidebar.tsx',                remote: '/www/wwwroot/n1.namainvist.com/src/components/Sidebar.tsx' },
    { local: 'src/app/api/tenant/hidden-modules/route.ts', remote: '/www/wwwroot/n1.namainvist.com/src/app/api/tenant/hidden-modules/route.ts' },
];

const OWNER_EMAIL = 'ialqrashi62@gmail.com';

const mkdirCmd = FILES_TO_UPLOAD
    .map(f => `mkdir -p "${path.dirname(f.remote)}"`)
    .join(' && ');

// Also update .env on remote with ICE_OWNER_EMAIL
const updateEnvCmd = `grep -q 'ICE_OWNER_EMAIL' /www/wwwroot/n1.namainvist.com/.env || echo '\n# ICE Panel\nICE_OWNER_EMAIL=${OWNER_EMAIL}\nPOSTGRES_ROOT_PASSWORD=RootPassNama123' >> /www/wwwroot/n1.namainvist.com/.env`;

conn.on('ready', () => {
    console.log('✅ SSH Connected to N1 (46.4.188.170)');

    // Step 1: Create directories
    conn.exec(mkdirCmd + ' && ' + updateEnvCmd, (err, stream) => {
        if (err) { console.error('mkdir error:', err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('📁 Directories created. Starting SFTP upload...');

            // Step 2: SFTP Upload
            conn.sftp((err, sftp) => {
                if (err) { console.error('SFTP error:', err); conn.end(); return; }

                let index = 0;
                const uploadNext = () => {
                    if (index >= FILES_TO_UPLOAD.length) {
                        console.log('\n✅ All files uploaded! Building...');
                        sftp.end();

                        conn.exec(`cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1 && pm2 save`, (err, stream) => {
                            if (err) { console.error('Build error:', err); conn.end(); return; }
                            stream.on('data', d => process.stdout.write(d));
                            stream.stderr.on('data', d => process.stderr.write(d));
                            stream.on('close', () => {
                                console.log('🚀 Build and restart complete!');
                                conn.end();
                            });
                        });
                        return;
                    }

                    const file = FILES_TO_UPLOAD[index++];
                    const localPath = path.join(__dirname, file.local);

                    if (!fs.existsSync(localPath)) {
                        console.log(`⚠️ Skipping (not found): ${file.local}`);
                        uploadNext();
                        return;
                    }

                    sftp.fastPut(localPath, file.remote, (err) => {
                        if (err) {
                            console.error(`❌ Failed: ${file.local} -> ${file.remote}`, err.message);
                        } else {
                            console.log(`📤 Uploaded: ${file.local}`);
                        }
                        uploadNext();
                    });
                };

                uploadNext();
            });
        });
    });
}).on('error', (err) => {
    console.error('❌ SSH Connection error:', err.message);
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 15000
});
