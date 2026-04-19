/**
 * Deploy font changes (Cairo → Lateef) to ALL tenant sites + N11 master template
 * Then rebuild and restart them
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_HOST = '46.4.188.170';
const SSH_USER = 'root';
const SSH_PASS = '_ee4SWbxLVfH9b';

// Files to update on every tenant
const FILES_TO_UPLOAD = [
    { local: 'src/app/globals.css',    remoteSuffix: 'src/app/globals.css' },
    { local: 'src/app/layout.tsx',     remoteSuffix: 'src/app/layout.tsx' },
    { local: 'src/app/_landing.tsx',   remoteSuffix: 'src/app/_landing.tsx' },
    { local: 'src/middleware.ts',      remoteSuffix: 'src/middleware.ts' },
];

function sftp(conn) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => err ? reject(err) : resolve(sftp));
    });
}

function sftpWrite(sftp, remotePath, content) {
    return new Promise((resolve, reject) => {
        sftp.writeFile(remotePath, content, (err) => err ? reject(err) : resolve());
    });
}

function runCmd(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', (d) => out += d.toString());
            stream.stderr.on('data', (d) => out += d.toString());
            stream.on('close', (code) => resolve({ code, out }));
        });
    });
}

async function main() {
    const conn = new Client();

    conn.on('ready', async () => {
        console.log('🔗 Connected to Fleet Server\n');

        try {
            // Step 1: Find all tenant/app directories
            console.log('🔍 Finding all app directories...');
            const { out: dirs } = await runCmd(conn,
                `ls -d /www/wwwroot/*/src/app/globals.css 2>/dev/null | sed 's|/src/app/globals.css||'`
            );
            const appDirs = dirs.trim().split('\n').filter(d => d.trim());
            console.log(`   Found ${appDirs.length} app directories:\n   ${appDirs.join('\n   ')}\n`);

            // Step 2: Upload files to each directory
            const sftpClient = await sftp(conn);
            const fileContents = FILES_TO_UPLOAD.map(f => ({
                ...f,
                content: fs.readFileSync(path.resolve(__dirname, f.local)),
            }));

            for (const dir of appDirs) {
                console.log(`📤 Updating ${dir}...`);
                for (const file of fileContents) {
                    const remotePath = `${dir}/${file.remoteSuffix}`;
                    try {
                        await sftpWrite(sftpClient, remotePath, file.content);
                        console.log(`   ✅ ${file.remoteSuffix}`);
                    } catch (e) {
                        console.log(`   ⚠️ ${file.remoteSuffix} — ${e.message}`);
                    }
                }
            }
            sftpClient.end();

            // Step 3: Also do a global sed replace for any remaining 'Cairo' references in .tsx/.css files
            console.log('\n🔄 Global sed replace Cairo → Lateef across all tenant apps...');
            const { out: sedOut } = await runCmd(conn, [
                `find /www/wwwroot -name "*.tsx" -o -name "*.css" -o -name "*.ts" | xargs grep -l "Cairo" 2>/dev/null | head -50`,
            ].join(' && '));
            
            if (sedOut.trim()) {
                console.log(`   Files still containing "Cairo":\n   ${sedOut.trim().split('\n').join('\n   ')}`);
                const { out: sedResult } = await runCmd(conn,
                    `find /www/wwwroot -name "*.tsx" -o -name "*.css" -o -name "*.ts" | xargs grep -l "Cairo" 2>/dev/null | xargs sed -i 's/Cairo/Lateef/g' 2>&1; echo "SED_DONE"`
                );
                console.log(`   ✅ sed replacement done`);
            } else {
                console.log('   ✅ No remaining Cairo references found');
            }

            // Step 4: Fix Google Fonts URL pattern (the weight range differs)
            console.log('\n🔄 Fixing Google Fonts URL weight ranges...');
            await runCmd(conn, [
                // Fix CSS @import URLs
                `find /www/wwwroot -name "*.css" | xargs sed -i "s|fonts.googleapis.com/css2?family=Lateef:wght@300;400;500;600;700;800;900|fonts.googleapis.com/css2?family=Lateef:wght@200;300;400;500;600;700;800|g" 2>/dev/null`,
                // Fix layout.tsx link tags
                `find /www/wwwroot -name "layout.tsx" | xargs sed -i "s|Lateef:wght@300;400;500;600;700;800;900|Lateef:wght@200;300;400;500;600;700;800|g" 2>/dev/null`,
            ].join(' && '));
            console.log('   ✅ Font weight URLs fixed');

            // Step 5: Rebuild N11 (master template) and tannm (user's current tenant)
            const toBuild = [
                { name: 'N11 (master)', path: '/www/wwwroot/n11.namainvist.com', pm2: 'n11' },
                { name: 'tannm', path: '/www/wwwroot/tannm.namainvist.com', pm2: 'tannm' },
                { name: 'Main Site', path: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
            ];

            for (const app of toBuild) {
                // Check if directory exists
                const { out: exists } = await runCmd(conn, `[ -d "${app.path}" ] && echo "YES" || echo "NO"`);
                if (exists.trim() !== 'YES') {
                    console.log(`\n⏭️ Skipping ${app.name} — directory not found`);
                    continue;
                }

                console.log(`\n🔨 Building ${app.name} (${app.path})...`);
                const { out: buildOut } = await runCmd(conn,
                    `cd ${app.path} && npm run build 2>&1 | tail -5`
                );
                console.log(`   ${buildOut.trim()}`);

                console.log(`   🔄 Restarting ${app.pm2}...`);
                const { out: restartOut } = await runCmd(conn,
                    `pm2 restart ${app.pm2} 2>&1 | tail -2`
                );
                console.log(`   ${restartOut.trim()}`);
            }

            // Step 6: Rebuild any other running PM2 tenants
            console.log('\n🔍 Finding other running tenant PM2 apps...');
            const { out: pm2List } = await runCmd(conn, 
                `pm2 jlist 2>/dev/null`
            );
            try {
                const apps = JSON.parse(pm2List);
                const tenantApps = apps.filter(a => 
                    a.pm2_env?.status === 'online' && 
                    !['main-site', 'n11', 'tannm', 'ice', 'saas-app', 'saas-dev'].includes(a.name) &&
                    a.pm2_env?.pm_cwd?.startsWith('/www/wwwroot/')
                );
                
                if (tenantApps.length > 0) {
                    console.log(`   Found ${tenantApps.length} other running tenants: ${tenantApps.map(a => a.name).join(', ')}`);
                    for (const app of tenantApps) {
                        const appPath = app.pm2_env.pm_cwd;
                        console.log(`   🔨 Rebuilding ${app.name}...`);
                        await runCmd(conn, `cd ${appPath} && npm run build 2>&1 | tail -2`);
                        await runCmd(conn, `pm2 restart ${app.name} 2>/dev/null`);
                        console.log(`   ✅ ${app.name} done`);
                    }
                } else {
                    console.log('   No other running tenants found');
                }
            } catch {
                console.log('   ⚠️ Could not parse PM2 list, skipping other tenants');
            }

            console.log('\n\n🎉 ========================');
            console.log('   DEPLOY COMPLETE!');
            console.log('   Font changed: Cairo → Lateef');
            console.log('   🎉 ========================\n');

        } catch (e) {
            console.error('❌ Error:', e.message);
        } finally {
            conn.end();
        }
    });

    conn.on('error', (err) => {
        console.error('❌ SSH Connection Error:', err.message);
    });

    conn.connect({
        host: SSH_HOST,
        port: 22,
        username: SSH_USER,
        password: SSH_PASS,
        readyTimeout: 30000,
    });
}

main();
