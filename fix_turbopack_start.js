/**
 * fix_turbopack_start.js
 * Next.js 16 uses Turbopack by default for builds but next start expects webpack BUILD_ID
 * Solution: Tell PM2 to use 'next start --turbo' OR downgrade to webpack build
 * 
 * We'll try: NEXT_TURBOPACK=0 build flag + restart
 */
const { Client } = require('ssh2');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const NODES = [
    { path: '/www/wwwroot/namainvist.com', name: 'main-site', port: 3000 },
    { path: '/www/wwwroot/n1.namainvist.com', name: 'n1-main', port: 3001 },
    { path: '/www/wwwroot/n11.namainvist.com', name: 'saas-dev', port: 3002 },
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

    // Strategy: Build with NEXT_TURBOPACK=0 env var to force webpack
    for (const node of NODES) {
        console.log(`\n${'═'.repeat(55)}\n  ${node.name}\n${'═'.repeat(55)}\n`);
        
        // Clean .next
        await exec(conn, `rm -rf ${node.path}/.next`, false);
        
        // Build with turbopack disabled via env
        console.log('Building with NEXT_TURBOPACK=0...');
        const result = await exec(conn, 
            `cd ${node.path} && NEXT_TURBOPACK=0 NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production npx prisma@5.22.0 generate 2>&1 | tail -1 && NEXT_TURBOPACK=0 NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production npx next build 2>&1 | tail -15`,
            true
        );
        
        // Check BUILD_ID
        const bid = await exec(conn, `cat ${node.path}/.next/BUILD_ID 2>/dev/null || echo "MISSING"`, false);
        const buildId = bid.out.trim();
        console.log(`\nBUILD_ID: ${buildId !== 'MISSING' ? '✅ ' + buildId : '❌ MISSING'}`);
        
        if (buildId === 'MISSING') {
            // Alternative: check if next start --port X works with turbopack build
            console.log('Checking if turbopack start works...');
            // The turbopack build uses .next/server/app but start looks for .next/BUILD_ID
            // Workaround: create a dummy BUILD_ID from the trace file
            const traceRes = await exec(conn, `cat ${node.path}/.next/trace-build 2>/dev/null | head -5`, false);
            console.log('trace-build:', traceRes.out.slice(0, 200));
            
            // If Turbopack, the build is in .next/build/ not .next/server/
            // Check what's in .next/build/
            await exec(conn, `ls -la ${node.path}/.next/build/ 2>/dev/null | head -10`, true);
        }
    }
    
    // Update ecosystem.config.js to use 'next start' (which works with both)
    console.log('\n═══ Checking if next start works with Turbopack output ═══\n');
    
    // Try to start manually with next start
    const startTest = await exec(conn, 
        `cd /www/wwwroot/namainvist.com && NODE_ENV=production timeout 10 node_modules/.bin/next start --port 3099 2>&1 || true`,
        true
    );
    
    conn.end();
    console.log('\n✅ Done\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
