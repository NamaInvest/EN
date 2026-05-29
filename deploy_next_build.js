/**
 * deploy_next_build.js
 * Uploads the locally-built .next folder to all server nodes
 * This bypasses the server-side build (which fails due to insufficient RAM)
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };
const NEXT_ZIP = 'd:\\namasoft9-3-main\\next_build.zip';

const NODES = [
    { path: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { path: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { path: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-dev' },
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
            const size = fs.statSync(localPath).size;
            let uploaded = 0;
            const stream = sftp.createWriteStream(remotePath);
            const readStream = fs.createReadStream(localPath);
            
            readStream.on('data', chunk => {
                uploaded += chunk.length;
                const pct = Math.round(uploaded / size * 100);
                process.stdout.write(`\r  Progress: ${pct}% (${Math.round(uploaded/1024/1024)}MB / ${Math.round(size/1024/1024)}MB)`);
            });
            
            stream.on('close', () => { console.log(''); sftp.end(); resolve(); });
            stream.on('error', err => { sftp.end(); reject(err); });
            readStream.pipe(stream);
        });
    });
}

async function run() {
    const zipSize = fs.statSync(NEXT_ZIP).size;
    console.log(`\n📦 .next archive: ${(zipSize/1024/1024).toFixed(1)} MB\n`);

    const conn = new Client();
    await new Promise((res, rej) => conn.on('ready', res).on('error', rej).connect(SERVER));
    console.log('✅ Connected to server\n');

    // Upload .next archive once
    console.log(`⬆️  Uploading .next build...`);
    await upload(conn, NEXT_ZIP, '/tmp/next_build.zip');
    console.log('✅ Upload complete\n');

    // Deploy to each node
    for (const node of NODES) {
        console.log(`\n${'═'.repeat(55)}`);
        console.log(`  Deploying .next to: ${node.pm2} (${node.path})`);
        console.log(`${'═'.repeat(55)}\n`);

        // Remove old .next, extract new one
        await exec(conn, `rm -rf ${node.path}/.next`, false);
        console.log('  Extracting...');
        await exec(conn, 
            `cd ${node.path} && unzip -o /tmp/next_build.zip 2>&1 | tail -3`,
            true
        );

        // Verify BUILD_ID
        const bid = await exec(conn, `cat ${node.path}/.next/BUILD_ID 2>/dev/null || echo "MISSING"`, false);
        const buildId = bid.out.trim();
        console.log(`\n  BUILD_ID: ${buildId !== 'MISSING' ? '✅ ' + buildId : '❌ MISSING'}`);
    }

    // Restart PM2
    console.log('\n\n═══ Restarting PM2 ═══\n');
    await exec(conn, 'pm2 restart main-site n1-main saas-dev --update-env 2>&1 | tail -5', true);
    
    await new Promise(r => setTimeout(r, 10000));
    await exec(conn, 'pm2 list 2>&1', true);

    // Health check
    console.log('\n═══ Health Checks ═══\n');
    for (const port of [3000, 3001, 3002]) {
        const r = await exec(conn, `curl -sf --max-time 15 http://localhost:${port}/api/health 2>/dev/null || echo "port ${port}: starting..."`, false);
        console.log(`  :${port} → ${r.out.trim()}`);
    }

    await exec(conn, 'pm2 save 2>&1 | tail -1', true);
    conn.end();
    console.log('\n✅ .next deploy complete!\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
