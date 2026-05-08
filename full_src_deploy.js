/**
 * full_src_deploy.js
 * Deploys complete src/app + next.config.ts to all server nodes
 * then rebuilds and restarts PM2
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const LOCAL_ROOT = 'd:\\namasoft9-3-main';
const ARCHIVE = 'd:\\namasoft9-3-main\\full_src.tar.gz';

const NODES = [
    { path: '/www/wwwroot/namainvist.com', name: 'main-site' },
    { path: '/www/wwwroot/n1.namainvist.com', name: 'n1-main' },
    { path: '/www/wwwroot/n11.namainvist.com', name: 'saas-dev' },
];

function exec(conn, cmd, print = true) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '', e = '';
            stream.on('data', d => { out += d; if (print) process.stdout.write(d); });
            stream.stderr.on('data', d => { e += d; if (print) process.stderr.write(d); });
            stream.on('close', code => resolve({ code, out, err: e }));
        });
    });
}

function upload(conn, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            sftp.fastPut(localPath, remotePath, {}, (err) => {
                sftp.end();
                if (err) reject(err); else resolve();
            });
        });
    });
}

async function run() {
    // Create archive of src/ + next.config.ts
    console.log('📦 Creating archive of src/ + configs...');
    try { fs.unlinkSync(ARCHIVE); } catch {}
    
    execSync(
        `tar -czf "${ARCHIVE}" src/ next.config.ts middleware.ts`,
        { cwd: LOCAL_ROOT, stdio: 'pipe' }
    );
    
    const size = fs.statSync(ARCHIVE).size;
    console.log(`✅ Archive: ${(size/1024/1024).toFixed(1)}MB\n`);

    const conn = new Client();
    await new Promise((res, rej) => conn.on('ready', res).on('error', rej).connect(SERVER));
    console.log('✅ Connected\n');

    // Upload archive
    console.log('⬆️  Uploading archive...');
    await upload(conn, ARCHIVE, '/tmp/full_src.tar.gz');
    console.log('✅ Upload complete\n');

    // Deploy to each node
    for (const node of NODES) {
        console.log(`\n${'═'.repeat(55)}`);
        console.log(`  Deploying to: ${node.name}`);
        console.log(`${'═'.repeat(55)}\n`);

        // Extract src/ over existing code
        await exec(conn, `cd ${node.path} && tar -xzf /tmp/full_src.tar.gz --overwrite 2>&1`, true);
        
        // Verify key fixed files are present
        const check1 = await exec(conn, `head -5 ${node.path}/src/app/\\(dashboard\\)/accounting/banks/\\[id\\]/page.tsx 2>/dev/null`, false);
        const isFixed = !check1.out.includes('async function BankStatementPage');
        console.log(`  banks/[id]: ${isFixed ? '✅ Fixed' : '❌ Still old'}`);

        // Build with webpack (not Turbopack)
        console.log(`\n  🔨 Building (standard webpack)...`);
        const buildRes = await exec(conn,
            `cd ${node.path} && NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production npm run build 2>&1 | tail -10`,
            true
        );

        // Check BUILD_ID
        const bidRes = await exec(conn, `cat ${node.path}/.next/BUILD_ID 2>/dev/null || echo "MISSING"`, false);
        const bid = bidRes.out.trim();
        console.log(`\n  BUILD_ID: ${bid !== 'MISSING' ? `✅ ${bid}` : '❌ MISSING'}`);
    }

    // Restart all PM2
    console.log('\n\n═══ Restarting PM2 ═══\n');
    await exec(conn, 'pm2 restart main-site n1-main saas-dev --update-env 2>&1 | tail -5', true);
    
    await new Promise(r => setTimeout(r, 10000));

    // Final PM2 status
    await exec(conn, 'pm2 list 2>&1', true);

    // Health checks
    console.log('\n═══ Health Checks ═══\n');
    for (const port of [3000, 3001, 3002]) {
        const r = await exec(conn, `curl -sf --max-time 12 http://localhost:${port}/api/health 2>/dev/null || echo "port ${port}: starting..."`, false);
        console.log(`  :${port} → ${r.out.trim()}`);
    }

    // Save PM2
    await exec(conn, 'pm2 save 2>&1 | tail -1', true);

    conn.end();
    
    // Cleanup
    try { fs.unlinkSync(ARCHIVE); } catch {}
    
    console.log('\n✅ Full deploy complete!\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
