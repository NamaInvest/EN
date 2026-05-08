/**
 * fix_build_mode.js
 * Change build script on server to NOT use Turbopack (which doesn't create BUILD_ID)
 * Then rebuild all nodes properly
 */
const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const NODES = [
    { path: '/www/wwwroot/namainvist.com', port: 3000, name: 'main-site', id: 32 },
    { path: '/www/wwwroot/n1.namainvist.com', port: 3001, name: 'n1-main', id: 33 },
    { path: '/www/wwwroot/n11.namainvist.com', port: 3002, name: 'saas-dev', id: 34 },
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

    // Check current package.json build script on server
    console.log('Current build script:');
    await exec(conn, "cat /www/wwwroot/namainvist.com/package.json | python3 -c \"import sys,json; d=json.load(sys.stdin); print(d.get('scripts',{}).get('build','?'))\"", true);

    // Fix: change build script to remove --turbo flag if present
    for (const node of NODES) {
        console.log(`\n── Fixing build script in ${node.name} ──`);
        
        // Read and fix package.json build script
        const pkgRes = await exec(conn, `cat ${node.path}/package.json`, false);
        let pkg;
        try { pkg = JSON.parse(pkgRes.out); } catch { console.log('  Cannot parse package.json'); continue; }
        
        const currentBuild = pkg.scripts?.build || '';
        console.log(`  Current: ${currentBuild}`);
        
        // Remove --turbo flag from build command
        const fixedBuild = currentBuild.replace(/\s*--turbo\b/g, '');
        console.log(`  Fixed:   ${fixedBuild}`);
        
        if (currentBuild !== fixedBuild) {
            pkg.scripts.build = fixedBuild;
            const newPkg = JSON.stringify(pkg, null, 2);
            await exec(conn, `cat > ${node.path}/package.json << 'PKGEOF'\n${newPkg}\nPKGEOF`, false);
            console.log(`  ✅ package.json updated`);
        } else {
            console.log(`  ℹ️  No --turbo flag found in build script`);
        }

        // Check next.config.ts for turbopack setting
        const nextConfig = await exec(conn, `cat ${node.path}/next.config.ts 2>/dev/null || cat ${node.path}/next.config.js 2>/dev/null`, false);
        
        if (nextConfig.out.includes('clientTraceMetadata') || nextConfig.out.includes('turbopack')) {
            console.log(`  ℹ️  Turbopack may be in next.config, checking...`);
        }

        // Clean .next and rebuild
        console.log(`\n  🔨 Clean build for ${node.name}...`);
        await exec(conn, `rm -rf ${node.path}/.next`, false);
        
        const buildResult = await exec(conn,
            `cd ${node.path} && NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production npm run build 2>&1 | tail -20`,
            true
        );
        
        // Check BUILD_ID
        const bidRes = await exec(conn, `cat ${node.path}/.next/BUILD_ID 2>/dev/null || echo "MISSING"`, false);
        const buildId = bidRes.out.trim();
        console.log(`\n  BUILD_ID: ${buildId !== 'MISSING' ? '✅ ' + buildId : '❌ STILL MISSING'}`);
    }

    // Restart all PM2
    console.log('\n═══ Restarting PM2 ═══\n');
    await exec(conn, 'pm2 restart all --update-env && pm2 list', true);
    
    await new Promise(r => setTimeout(r, 10000));
    
    // Final health check
    console.log('\n═══ Health Check ═══\n');
    for (const port of [3000, 3001, 3002]) {
        const r = await exec(conn, `curl -sf --max-time 10 http://localhost:${port}/api/health 2>/dev/null || echo "port ${port}: starting..."`, false);
        console.log(`  :${port} → ${r.out.trim()}`);
    }

    // Final PM2 list
    await exec(conn, 'pm2 list', true);

    conn.end();
    console.log('\n✅ Build mode fix complete\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
