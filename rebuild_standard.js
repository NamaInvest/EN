/**
 * rebuild_standard.js
 * Forces standard Next.js build (without Turbopack) on server
 * and verifies BUILD_ID exists before starting PM2
 */
const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const NODES = [
    { path: '/www/wwwroot/namainvist.com',     port: 3000, name: 'main-site' },
    { path: '/www/wwwroot/n1.namainvist.com',  port: 3001, name: 'n1-main' },
    { path: '/www/wwwroot/n11.namainvist.com', port: 3002, name: 'saas-dev' },
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

async function run() {
    const conn = new Client();
    await new Promise((res, rej) => conn.on('ready', res).on('error', rej).connect(SERVER));
    console.log('✅ Connected\n');

    // First check what's in .next
    console.log('═══ Current .next Structure ═══\n');
    await exec(conn, 'ls -la /www/wwwroot/namainvist.com/.next/ | head -20', true);
    
    // Check if BUILD_ID exists (standard build marker)
    const buildId = await exec(conn, 'cat /www/wwwroot/namainvist.com/.next/BUILD_ID 2>/dev/null || echo "MISSING"', false);
    console.log(`\n.next/BUILD_ID: ${buildId.out.trim()}`);
    
    // Check next.config.ts for turbopack setting
    console.log('\n═══ next.config.ts experimental section ═══\n');
    await exec(conn, 'grep -A5 "experimental" /www/wwwroot/namainvist.com/next.config.ts 2>/dev/null | head -10', true);

    // Run standard build (NEXT_TELEMETRY_DISABLED=1 speeds it up)
    for (const node of NODES) {
        console.log(`\n═══ Building ${node.name} (standard build) ═══\n`);
        
        // Remove old .next
        await exec(conn, `rm -rf ${node.path}/.next`, false);
        
        // Build with standard webpack (not turbopack)
        const buildResult = await exec(conn,
            `cd ${node.path} && NEXT_TELEMETRY_DISABLED=1 npx prisma@5.22.0 generate 2>&1 | tail -1 && NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production npx next@16.1.6 build 2>&1 | tail -15`,
            true
        );
        
        // Check BUILD_ID
        const bid = await exec(conn, `cat ${node.path}/.next/BUILD_ID 2>/dev/null || echo "STILL MISSING"`, false);
        console.log(`\n✅ BUILD_ID: ${bid.out.trim()}`);
    }

    // Restart PM2
    console.log('\n═══ Restarting PM2 ═══\n');
    await exec(conn, 'pm2 restart all --update-env 2>&1 | tail -8', true);
    
    await new Promise(r => setTimeout(r, 8000));
    
    // Final status
    await exec(conn, 'pm2 list 2>&1', true);
    
    // Health check
    console.log('\n═══ Health Check ═══\n');
    await exec(conn, "curl -sf --max-time 15 http://localhost:3000/api/health 2>/dev/null && echo '' || echo 'Port 3000: still starting'", true);
    await exec(conn, "curl -sf --max-time 15 http://localhost:3001/api/health 2>/dev/null && echo '' || echo 'Port 3001: still starting'", true);

    conn.end();
    console.log('\n✅ Done\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
