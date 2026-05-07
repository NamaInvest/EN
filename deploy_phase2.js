/**
 * Deploy Phase 0-2 + Saudi Compliance to Fleet Server
 * Uploads all new engines, APIs, UI pages, and schema changes
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const TARGETS = [
    { base: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { base: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { base: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' }
];

const LOCAL_BASE = 'd:\\namasoft9-3-main';

// ── All new + modified files for Phase 0-2 + Saudi ──
const FILES = [
    // Schema
    "prisma/schema.prisma",

    // Sidebar (modified)
    "src/components/Sidebar.tsx",

    // ── Phase 0 (Foundation) ──
    "src/lib/numbering-engine.ts",
    "src/app/(dashboard)/settings/number-sequences/page.tsx",

    // ── Phase 1 (Saudi Critical) ──
    "src/lib/qiwa-engine.ts",
    "src/lib/pdpl-engine.ts",
    "src/lib/vat-classifier.ts",
    "src/lib/mudad-compliance.ts",
    "src/lib/wht-engine.ts",
    // Saudi APIs
    "src/app/api/saudi/qiwa/sync/route.ts",
    "src/app/api/saudi/qiwa/contracts/[employeeId]/route.ts",
    "src/app/api/saudi/saudization/snapshot/route.ts",
    "src/app/api/saudi/nitaqat/projection/route.ts",
    "src/app/api/pdpl/dsr/route.ts",
    "src/app/api/pdpl/dsr/[id]/fulfill/route.ts",
    "src/app/api/pdpl/breach/route.ts",
    "src/app/api/vat/categories/route.ts",
    "src/app/api/wht/calculate/route.ts",
    "src/app/api/wht/form14/generate/route.ts",
    "src/app/api/saudi/mudad/compliance/route.ts",

    // ── Phase 2 (Finance) ──
    "src/lib/credit-check-engine.ts",
    "src/lib/cash-forecast-engine.ts",
    "src/app/api/credit-check/route.ts",
    "src/app/api/budgets/route.ts",
    "src/app/api/purchasing/three-way-match/route.ts",
    "src/app/api/fx/route.ts",

    // ── Phase 6 (Webhook) ──
    "src/lib/webhook-engine.ts",
    "src/app/api/webhooks/route.ts",
];

// Tenant DBs that need schema push + GRANT
const TENANT_DBS = [
    { db: 'namadb', user: 'namadb' },
    { db: 'n1_db', user: 'n1_db' },
    { db: 'n11_db', user: 'n11_db' },
    { db: 'n2_db', user: 'n2_db' },
    { db: 'n3_db', user: 'n3_db' },
    { db: 'n4_db', user: 'n4_db' },
    { db: 'n5_db', user: 'n5_db' },
    { db: 'n6_db', user: 'n6_db' },
    { db: 'n7_db', user: 'n7_db' },
    { db: 'n8_db', user: 'n8_db' },
    { db: 'n9_db', user: 'n9_db' },
];

function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        const data = fs.readFileSync(localPath);
        sftp.writeFile(remotePath, data, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function execCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; process.stdout.write(d.toString()); });
            stream.stderr.on('data', d => { stderr += d; process.stderr.write(d.toString()); });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

function mkdirRecursive(sftp, dirPath) {
    return new Promise((resolve) => {
        sftp.mkdir(dirPath, (err) => resolve());
    });
}

async function deploy() {
    const conn = new Client();
    
    console.log('🔌 Connecting to Fleet Server (46.4.188.170)...');
    console.log(`📦 Files to deploy: ${FILES.length}`);
    console.log(`🗄️ Tenant DBs to migrate: ${TENANT_DBS.length}\n`);
    
    conn.on('ready', async () => {
        console.log('✅ Connected!\n');
        
        try {
            const sftp = await new Promise((resolve, reject) => {
                conn.sftp((err, sftp) => err ? reject(err) : resolve(sftp));
            });

            // ── Step 1: Upload files to all targets ──
            for (const target of TARGETS) {
                console.log(`\n${'='.repeat(60)}`);
                console.log(`🚀 UPLOADING TO ${target.base}`);
                console.log(`${'='.repeat(60)}\n`);

                // Create directories
                const dirs = new Set();
                for (const file of FILES) {
                    const parts = file.split('/');
                    let current = target.base;
                    for (let i = 0; i < parts.length - 1; i++) {
                        current += '/' + parts[i];
                        dirs.add(current);
                    }
                }
                for (const dir of [...dirs].sort()) {
                    await mkdirRecursive(sftp, dir);
                }

                // Upload files
                let uploaded = 0, skipped = 0;
                for (const file of FILES) {
                    const localPath = path.join(LOCAL_BASE, file.replace(/\//g, '\\'));
                    const remotePath = `${target.base}/${file}`;
                    
                    if (!fs.existsSync(localPath)) {
                        console.log(`  ⚠️  SKIP: ${file}`);
                        skipped++;
                        continue;
                    }
                    
                    try {
                        await uploadFile(sftp, localPath, remotePath);
                        uploaded++;
                        console.log(`  ✅ ${file}`);
                    } catch (e) {
                        console.log(`  ❌ FAIL: ${file} — ${e.message}`);
                    }
                }
                console.log(`\n📊 Uploaded ${uploaded} | Skipped ${skipped} | Total ${FILES.length}`);
            }

            // ── Step 2: Prisma generate on main site ──
            console.log('\n\n🔧 Running prisma generate on main site...');
            await execCommand(conn, `cd /www/wwwroot/namainvist.com && npx prisma generate`);

            // ── Step 3: Schema push to ALL tenant DBs ──
            console.log('\n\n🗄️ Pushing schema to ALL tenant databases...\n');
            for (const tenant of TENANT_DBS) {
                const dbUrl = `postgresql://postgres@localhost:5432/${tenant.db}?schema=public`;
                console.log(`  📌 ${tenant.db}...`);
                await execCommand(conn, `cd /www/wwwroot/namainvist.com && DATABASE_URL="${dbUrl}" npx prisma db push --accept-data-loss 2>&1 | tail -3`);
                
                // GRANT permissions
                await execCommand(conn, `sudo -u postgres psql -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${tenant.user};" ${tenant.db}`);
                await execCommand(conn, `sudo -u postgres psql -h localhost -p 5432 -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ${tenant.user};" ${tenant.db}`);
                console.log(`  ✅ ${tenant.db} — schema pushed + permissions granted`);
            }

            // ── Step 4: Rebuild + restart all PM2 apps ──
            for (const target of TARGETS) {
                console.log(`\n🏗️ Building ${target.base}...`);
                await execCommand(conn, `cd ${target.base} && npx prisma generate && rm -rf .next && npm run build 2>&1 | tail -5`);
                
                console.log(`🔄 Restarting ${target.pm2}...`);
                await execCommand(conn, `pm2 restart ${target.pm2}`);
                console.log(`✅ ${target.pm2} restarted!`);
            }

            // ── Step 5: Health check ──
            console.log('\n\n🩺 Health Check...');
            for (const domain of ['namainvist.com', 'n1.namainvist.com', 'n11.namainvist.com']) {
                const result = await execCommand(conn, `curl -s -o /dev/null -w "%{http_code}" https://${domain}/ 2>/dev/null || echo "FAIL"`);
                const status = result.stdout.trim();
                console.log(`  ${status === '200' ? '✅' : '⚠️'} ${domain} → HTTP ${status}`);
            }

            console.log('\n\n🎉🎉🎉 DEPLOYMENT COMPLETE! 🎉🎉🎉\n');

        } catch (err) {
            console.error('❌ Deploy error:', err.message);
        }
        
        conn.end();
    });

    conn.on('error', (err) => {
        console.error('❌ Connection error:', err.message);
    });

    conn.connect(SERVER);
}

deploy();
