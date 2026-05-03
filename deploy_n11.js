/**
 * Deploy to n11.namainvist.com (Fleet Server 46.4.188.170)
 * Uses ssh2 for password-based auth
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

const REMOTE_BASE = '/www/wwwroot/n11.namainvist.com';
const LOCAL_BASE = 'd:\\namasoft9-3-main';

// All files to deploy
const FILES = [
    // Engines
    'src/lib/consolidation-engine.ts',
    'src/lib/cash-flow-forecasting.ts',
    'src/lib/leave-engine.ts',
    'src/lib/document-expiry.ts',
    'src/lib/saudi-eos-engine.ts',
    'src/lib/fx-revaluation.ts',
    'src/lib/allocation-engine.ts',
    'src/lib/budget-control.ts',
    // Finance API routes
    'src/app/api/finance/cash-flow/route.ts',
    'src/app/api/finance/consolidation/route.ts',
    'src/app/api/finance/fx-revaluation/route.ts',
    'src/app/api/finance/allocation/route.ts',
    'src/app/api/finance/budget-control/route.ts',
    // HR API routes
    'src/app/api/hr/leaves/route.ts',
    'src/app/api/hr/leaves/accrual/route.ts',
    'src/app/api/hr/leaves/balance/route.ts',
    'src/app/api/hr/leaves/[id]/route.ts',
    'src/app/api/hr/documents/expiry/route.ts',
    'src/app/api/hr/documents/expiry/[id]/route.ts',
    'src/app/api/hr/eos/route.ts',
    'src/app/api/hr/eos/[id]/route.ts',
    // Finance UI pages
    'src/app/(dashboard)/finance/cash-flow/page.tsx',
    'src/app/(dashboard)/finance/consolidation/page.tsx',
    'src/app/(dashboard)/finance/fx-revaluation/page.tsx',
    'src/app/(dashboard)/finance/allocation/page.tsx',
    'src/app/(dashboard)/finance/budget-control/page.tsx',
    // HR UI pages
    'src/app/(dashboard)/hr/leaves/page.tsx',
    'src/app/(dashboard)/hr/documents/page.tsx',
    'src/app/(dashboard)/hr/eos/page.tsx',
    // Shared components
    'src/components/Sidebar.tsx',
    // Schema
    'prisma/schema.prisma',
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
        sftp.mkdir(dirPath, (err) => {
            resolve(); // ignore errors (dir may exist)
        });
    });
}

async function deploy() {
    const conn = new Client();
    
    console.log('🔌 Connecting to Fleet Server (46.4.188.170)...');
    
    conn.on('ready', async () => {
        console.log('✅ Connected!\n');
        
        try {
            // Step 1: Upload files via SFTP
            console.log('📦 Uploading files to n11.namainvist.com...\n');
            
            const sftp = await new Promise((resolve, reject) => {
                conn.sftp((err, sftp) => err ? reject(err) : resolve(sftp));
            });

            // Collect all unique directories to create
            const dirs = new Set();
            for (const file of FILES) {
                const parts = file.split('/');
                let current = REMOTE_BASE;
                for (let i = 0; i < parts.length - 1; i++) {
                    current += '/' + parts[i];
                    dirs.add(current);
                }
            }

            // Create directories
            for (const dir of [...dirs].sort()) {
                await mkdirRecursive(sftp, dir);
            }

            // Upload files
            let uploaded = 0;
            for (const file of FILES) {
                const localPath = path.join(LOCAL_BASE, file.replace(/\//g, '\\'));
                const remotePath = `${REMOTE_BASE}/${file}`;
                
                if (!fs.existsSync(localPath)) {
                    console.log(`  ⚠️  SKIP (not found): ${file}`);
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

            console.log(`\n📊 Uploaded ${uploaded}/${FILES.length} files\n`);

            // Step 2: Generate Prisma, Build, Restart
            console.log('🔧 Running prisma generate...');
            await execCommand(conn, `cd ${REMOTE_BASE} && npx prisma generate`);

            console.log('\n🔧 Running prisma db push...');
            await execCommand(conn, `cd ${REMOTE_BASE} && npx prisma db push --accept-data-loss`);

            console.log('\n🏗️  Building Next.js...');
            await execCommand(conn, `cd ${REMOTE_BASE} && npm run build`);

            console.log('\n🔄 Restarting PM2 (n11)...');
            await execCommand(conn, `pm2 restart n11`);

            console.log('\n\n🎉 Deploy to n11.namainvist.com COMPLETE!');
            
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
