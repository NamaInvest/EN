/**
 * zip_src_deploy.js
 * Deploys full_src.zip to all server nodes via SSH/SFTP
 * Extracts using Python/unzip on server, then rebuilds
 */
const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };
const LOCAL_ZIP = 'd:\\namasoft9-3-main\\full_src.zip';

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
    const conn = new Client();
    await new Promise((res, rej) => conn.on('ready', res).on('error', rej).connect(SERVER));
    console.log('✅ Connected\n');

    // Upload archive
    console.log(`⬆️  Uploading ${(fs.statSync(LOCAL_ZIP).size/1024/1024).toFixed(1)}MB zip...`);
    await upload(conn, LOCAL_ZIP, '/tmp/full_src.zip');
    console.log('✅ Upload complete\n');

    // Install unzip if needed
    await exec(conn, 'which unzip 2>/dev/null || apt-get install -y unzip 2>&1 | tail -1', false);

    // Deploy to each node
    for (const node of NODES) {
        console.log(`\n${'═'.repeat(55)}`);
        console.log(`  Deploying to: ${node.name} (${node.path})`);
        console.log(`${'═'.repeat(55)}\n`);

        // Extract zip, overwriting existing files
        await exec(conn, 
            `cd ${node.path} && unzip -o /tmp/full_src.zip -x "*.pyc" "__pycache__/*" 2>&1 | tail -5`,
            true
        );
        
        // Verify key files are the new version
        const check = await exec(conn, `grep -c "async function BankStatementPage" "${node.path}/src/app/(dashboard)/accounting/banks/\\[id\\]/page.tsx" 2>/dev/null || echo 0`, false);
        const isFixed = parseInt(check.out.trim()) === 0;
        console.log(`\n  banks/[id] async fix: ${isFixed ? '✅' : '❌ Still old'}`);
        
        const checkMixed = await exec(conn, `grep -c "from '@/lib/server-t'" "${node.path}/src/app/(dashboard)/treasury/cash-flow/page.tsx" 2>/dev/null || echo 0`, false);
        const noMixed = parseInt(checkMixed.out.trim()) === 0;
        console.log(`  cash-flow server-t removed: ${noMixed ? '✅' : '❌'}`);

        // Rebuild
        console.log(`\n  🔨 Building...`);
        await exec(conn, `rm -rf ${node.path}/.next`, false);
        await exec(conn,
            `cd ${node.path} && NODE_OPTIONS="--max-old-space-size=3000" NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production npm run build 2>&1 | tail -20`,
            true
        );

        // Check BUILD_ID
        const bid = await exec(conn, `cat ${node.path}/.next/BUILD_ID 2>/dev/null || echo "MISSING"`, false);
        console.log(`\n  BUILD_ID: ${bid.out.trim() !== 'MISSING' ? '✅ ' + bid.out.trim() : '❌ MISSING'}`);
    }

    // Restart PM2
    console.log('\n\n═══ Restarting PM2 ═══\n');
    await exec(conn, 'pm2 restart main-site n1-main saas-dev --update-env 2>&1 | tail -5', true);
    
    await new Promise(r => setTimeout(r, 12000));
    
    // Final status
    await exec(conn, 'pm2 list 2>&1', true);
    
    console.log('\n═══ Health Checks ═══\n');
    for (const port of [3000, 3001, 3002]) {
        const r = await exec(conn, `curl -sf --max-time 15 http://localhost:${port}/api/health 2>/dev/null || echo "port ${port}: starting..."`, false);
        console.log(`  :${port} → ${r.out.trim()}`);
    }

    // PM2 logs for any last error
    console.log('\n═══ Recent Logs ═══\n');
    await exec(conn, 'pm2 logs main-site --lines 8 --nostream 2>&1', true);

    await exec(conn, 'pm2 save 2>&1 | tail -1', true);
    conn.end();
    console.log('\n✅ Full deploy complete!\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
