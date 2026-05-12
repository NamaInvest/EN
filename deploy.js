/**
 * 🚀 NamaInvest Smart Deploy Script
 * 
 * القواعد:
 * 1. لا تحذف .next أبداً — ابني فوقه
 * 2. ملفات API فقط → رفع + restart (بدون build)
 * 3. ملفات config/UI → build + restart
 * 4. البناء متوازي لتوفير الوقت
 * 
 * Usage:
 *   node deploy.js                    → نشر ذكي (يكتشف نوع التغييرات)
 *   node deploy.js --files-only       → رفع ملفات + restart فقط (ثواني)
 *   node deploy.js --build            → رفع + build + restart (2 دقيقة/موقع)
 *   node deploy.js --build --parallel → رفع + بناء متوازي (أسرع)
 *   node deploy.js --restart-only     → restart PM2 فقط
 *   node deploy.js --db-push          → تشغيل Prisma db push على السيرفر
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const SITES = {
    'main-site':  { path: '/www/wwwroot/namainvist.com',      pm2: 'main-site' },
    'n1':         { path: '/www/wwwroot/namainvist.com',       pm2: 'n1-main' },
    'n11':        { path: '/www/wwwroot/namainvist.com',       pm2: 'saas-app' },
};

// Files that REQUIRE a rebuild when changed
const BUILD_REQUIRED_PATTERNS = [
    'next.config.ts', 'middleware.ts', 'package.json',
    'tailwind.config', 'postcss.config', 'tsconfig.json',
    /\.css$/,           // Global CSS changes
    /\/components\//,   // UI components
    /\/app\/.*page\./,  // Page files
    /\/app\/.*layout\./, // Layout files
];

// Files that only need restart (no build)
const RESTART_ONLY_PATTERNS = [
    /\/api\//,          // API routes
    /\/lib\//,          // Library files
    /\/utils\//,        // Utility files
    /\/locales\//,      // Translation files
];

// ─── Helpers ─────────────────────────────────────────────────────
function exec(conn, cmd, timeout = 300000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            console.log(`⏰ Timeout for: ${cmd.substring(0, 60)}...`);
            resolve({ code: -1, stdout: 'TIMEOUT', stderr: '' });
        }, timeout);
        
        conn.exec(cmd, (err, stream) => {
            if (err) { clearTimeout(timer); return reject(err); }
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => {
                clearTimeout(timer);
                resolve({ code, stdout, stderr });
            });
        });
    });
}

function uploadFile(conn, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            const content = fs.readFileSync(localPath);
            sftp.writeFile(remotePath, content, (err) => {
                sftp.end();
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

function needsBuild(filePath) {
    return BUILD_REQUIRED_PATTERNS.some(pattern => {
        if (typeof pattern === 'string') return filePath.includes(pattern);
        return pattern.test(filePath);
    });
}

// ─── Deploy Modes ────────────────────────────────────────────────
async function deployFilesOnly(conn, files) {
    console.log(`\n📤 Uploading ${files.length} file(s) to all sites...`);
    const start = Date.now();
    
    for (const file of files) {
        const localPath = path.resolve(file);
        if (!fs.existsSync(localPath)) {
            console.log(`⚠️  Skipped (not found): ${file}`);
            continue;
        }
        
        for (const [name, site] of Object.entries(SITES)) {
            const remotePath = `${site.path}/${file}`;
            try {
                await uploadFile(conn, localPath, remotePath);
                console.log(`  ✅ ${name}: ${file}`);
            } catch (e) {
                console.log(`  ❌ ${name}: ${file} — ${e.message}`);
            }
        }
    }
    
    await restartSites(conn);
    console.log(`\n⚡ Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

async function deployWithBuild(conn, files, parallel = false) {
    const start = Date.now();
    
    // 1. Upload files
    if (files.length > 0) {
        console.log(`\n📤 Uploading ${files.length} file(s)...`);
        for (const file of files) {
            const localPath = path.resolve(file);
            if (!fs.existsSync(localPath)) continue;
            
            for (const [name, site] of Object.entries(SITES)) {
                const remotePath = `${site.path}/${file}`;
                try {
                    await uploadFile(conn, localPath, remotePath);
                } catch (e) { /* skip */ }
            }
        }
        console.log('  ✅ Files uploaded');
    }
    
    // 2. Build (NO rm -rf .next! ⚠️)
    console.log(`\n🔨 Building... (${parallel ? 'parallel' : 'sequential'})`);
    
    if (parallel) {
        // Build all sites simultaneously
        const builds = Object.entries(SITES).map(([name, site]) => {
            console.log(`  🏗️  ${name} building...`);
            return exec(conn, `cd ${site.path} && npm run build 2>&1 | tail -3`).then(r => {
                console.log(`  ✅ ${name} built`);
                return { name, ...r };
            });
        });
        await Promise.all(builds);
    } else {
        for (const [name, site] of Object.entries(SITES)) {
            console.log(`  🏗️  ${name} building...`);
            await exec(conn, `cd ${site.path} && npm run build 2>&1 | tail -3`);
            console.log(`  ✅ ${name} built`);
        }
    }
    
    // 3. Restart
    await restartSites(conn);
    
    console.log(`\n⚡ Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

async function restartSites(conn) {
    console.log(`\n🔄 Restarting all PM2 processes...`);
    for (const site of Object.values(SITES)) {
        await exec(conn, `pm2 restart ${site.pm2}`);
        console.log(`  ✅ ${site.pm2} restarted`);
    }
}

async function runDbPush(conn) {
    console.log(`\n🛠️ Running Prisma DB Push on Main Site...`);
    const site = SITES['main-site'];
    const cmd = `cd ${site.path} && npx prisma@5.22.0 db push --accept-data-loss`;
    const res = await exec(conn, cmd, 120000);
    console.log(`  ✅ DB Push Complete\nSTDOUT:\n${res.stdout}\nSTDERR:\n${res.stderr}`);
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--restart-only')) {
        const conn = new Client();
        conn.on('ready', async () => { await restartSites(conn); conn.end(); });
        conn.connect(SERVER);
        return;
    }

    if (args.includes('--db-push')) {
        const conn = new Client();
        conn.on('ready', async () => {
            await uploadFile(conn, 'prisma/schema.prisma', `${SITES['main-site'].path}/prisma/schema.prisma`);
            await uploadFile(conn, 'prisma/schema.prisma', `${SITES['n1'].path}/prisma/schema.prisma`);
            await uploadFile(conn, 'prisma/schema.prisma', `${SITES['n11'].path}/prisma/schema.prisma`);
            await runDbPush(conn);
            await restartSites(conn);
            conn.end();
        });
        conn.connect(SERVER);
        return;
    }

    const mode = args.includes('--files-only')   ? 'files'
               : args.includes('--build')         ? 'build'
               : 'smart';
    const parallel = args.includes('--parallel');
    const files = args.filter(a => !a.startsWith('--'));
    
    console.log('🚀 NamaInvest Smart Deploy');
    console.log(`   Mode: ${mode} | Files: ${files.length || 'auto'} | Parallel: ${parallel}`);
    
    const conn = new Client();
    
    conn.on('ready', async () => {
        try {
            switch (mode) {
                case 'files':
                    if (files.length === 0) {
                        console.log('❌ Specify files: node deploy.js --files-only file1.ts file2.ts');
                        break;
                    }
                    await deployFilesOnly(conn, files);
                    break;
                    
                case 'build':
                    await deployWithBuild(conn, files, parallel);
                    break;
                    
                case 'smart':
                    if (files.length === 0) {
                        console.log('❌ Specify files: node deploy.js file1.ts file2.ts');
                        console.log('   Or use: node deploy.js --restart-only');
                        break;
                    }
                    const requiresBuild = files.some(f => needsBuild(f));
                    if (requiresBuild) {
                        console.log('📋 Detected config/UI changes → build required');
                        await deployWithBuild(conn, files, parallel);
                    } else {
                        console.log('📋 API/lib changes only → restart sufficient');
                        await deployFilesOnly(conn, files);
                    }
                    break;
            }
            
            // Final status
            const { stdout } = await exec(conn, 'pm2 list');
            console.log('\n📊 Server Status:');
            console.log(stdout);
            
        } catch (e) {
            console.error('❌ Error:', e.message);
        } finally {
            conn.end();
        }
    });
    
    conn.on('error', e => console.error('❌ SSH Error:', e.message));
    conn.connect(SERVER);
}

main();
