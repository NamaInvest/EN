/**
 * diagnose_and_fix.js
 * Final diagnosis and fix for BUILD_ID missing issue
 */
const { Client } = require('ssh2');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };

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

    const node = '/www/wwwroot/namainvist.com';

    // 1. Show exact build script
    console.log('1. Build script:');
    await exec(conn, `cat ${node}/package.json | python3 -c "import sys,json; d=json.load(sys.stdin); [print(k,'->',v) for k,v in d.get('scripts',{}).items()]"`, true);

    // 2. Show next.config.ts turbopack section
    console.log('\n2. next.config.ts (relevant):');
    await exec(conn, `grep -n -i "turbo\|reactCompiler\|experimental" ${node}/next.config.ts 2>/dev/null`, true);

    // 3. Next.js version
    console.log('\n3. Next.js version:');
    await exec(conn, `cat ${node}/node_modules/next/package.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('version','?'))"`, true);

    // 4. Try build WITHOUT turbopack (force webpack)
    console.log('\n4. Testing explicit webpack build...');
    await exec(conn, `rm -rf ${node}/.next && cd ${node} && NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production NEXT_EXPERIMENTAL_TESTMODE=1 npx prisma@5.22.0 generate 2>&1 | tail -1`, true);
    
    // Force next build with --no-turbo flag if available
    const buildRes = await exec(conn, 
        `cd ${node} && NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production npx next build 2>&1 | tail -20`,
        true
    );

    // Check BUILD_ID
    const bid = await exec(conn, `cat ${node}/.next/BUILD_ID 2>/dev/null || echo "MISSING"`, false);
    console.log(`\nBUILD_ID: ${bid.out.trim()}`);

    // 5. Show what's in .next after build
    console.log('\n5. .next contents:');
    await exec(conn, `ls -la ${node}/.next/ 2>/dev/null | head -20`, true);

    conn.end();
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
