/**
 * Deploy all API routes + lib/prisma.ts to saas-app
 * يرفع كل الملفات المُعدَّلة دفعةً واحدة
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_HOST = '46.4.188.170';
const SSH_USER = 'root';
const SSH_PASS = '_ee4SWbxLVfH9b';
const LOCAL_BASE = 'd:/namasoft9-3-main';
const REMOTE_BASE = '/www/wwwroot/n11.namainvist.com';

// جمع كل route files + lib/prisma.ts + settings/route.ts
function getAllRouteFiles(dir, base) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getAllRouteFiles(full, base));
        } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
            files.push(full);
        }
    }
    return files;
}

const apiDir = path.join(LOCAL_BASE, 'src/app/api');
const apiFiles = getAllRouteFiles(apiDir, LOCAL_BASE);

// أضف lib/prisma.ts
const extraFiles = [
    path.join(LOCAL_BASE, 'src/lib/prisma.ts'),
    path.join(LOCAL_BASE, 'src/app/auto-login/page.tsx'),
    path.join(LOCAL_BASE, 'src/app/company-info/page.tsx'),
    path.join(LOCAL_BASE, 'src/app/(dashboard)/company-info/page.tsx'),
];

const allFiles = [...apiFiles, ...extraFiles.filter(f => fs.existsSync(f))];
console.log(`Uploading ${allFiles.length} files...`);

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Connected');
    conn.sftp(async (err, sftp) => {
        if (err) throw err;

        let uploaded = 0;
        let failed = 0;

        // Upload in serial (to avoid overwhelming SFTP)
        for (const localFile of allFiles) {
            const rel = path.relative(LOCAL_BASE, localFile).replace(/\\/g, '/');
            const remoteFile = `${REMOTE_BASE}/${rel}`;
            const remoteDir = path.dirname(remoteFile);

            await new Promise(resolve => {
                // Create parent directory via exec (mkdir -p)
                conn.exec(`mkdir -p "${remoteDir}"`, (e, stream) => {
                    if (e) { resolve(); return; }
                    stream.on('close', resolve);
                    stream.on('data', () => {});
                    stream.stderr.on('data', () => {});
                });
            });

            await new Promise(resolve => {
                sftp.fastPut(localFile, remoteFile, {}, putErr => {
                    if (putErr) {
                        console.error(`❌ Failed: ${rel} — ${putErr.message}`);
                        failed++;
                    } else {
                        uploaded++;
                        if (uploaded % 20 === 0) console.log(`  ... ${uploaded}/${allFiles.length} uploaded`);
                    }
                    resolve(null);
                });
            });
        }

        console.log(`\n✅ Uploaded ${uploaded} files, ❌ Failed: ${failed}`);

        // Build & restart saas-app
        console.log('\n🔨 Building saas-app...');
        conn.exec(
            'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -30 && pm2 restart saas-app && echo "✅ DONE"',
            (buildErr, stream) => {
                if (buildErr) { console.error(buildErr); conn.end(); return; }
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => { console.log('\n🎉 Deploy complete!'); conn.end(); });
            }
        );
    });
}).connect({ host: SSH_HOST, port: 22, username: SSH_USER, password: SSH_PASS, readyTimeout: 30000 });
