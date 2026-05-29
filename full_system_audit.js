/**
 * full_system_audit.js
 * ─────────────────────────────────────────────────────────────────
 * Comprehensive production audit:
 *   1. PM2 status (all processes)
 *   2. Health check on all 3 domains
 *   3. Check for critical .env variables
 *   4. DB connectivity and table count
 *   5. Remaining double precision columns
 *   6. Check dangerous routes are disabled
 *   7. Disk space
 */
const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };
const pgUser = 'postgres', pgPass = 'RootPassNama1', pgHost = 'localhost', pgPort = '5432', pgDb = 'n11_db';

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

    const sep = (title) => console.log(`\n${'═'.repeat(60)}\n  ${title}\n${'═'.repeat(60)}\n`);

    // 1. PM2 Status
    sep('1️⃣  PM2 Process Status');
    await exec(conn, 'pm2 list 2>&1', true);

    // 2. Health checks on all domains
    sep('2️⃣  Health Checks');
    for (const domain of ['namainvist.com', 'n1.namainvist.com', 'n11.namainvist.com']) {
        process.stdout.write(`  ${domain}: `);
        const r = await exec(conn, `curl -sf --max-time 5 https://${domain}/api/health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "unreachable"`, false);
        console.log(r.out.trim());
    }

    // 3. Check .env variables on main
    sep('3️⃣  Critical .env Variables');
    for (const varName of ['JWT_SECRET', 'ENCRYPTION_KEY', 'DATABASE_URL', 'GEMINI_API_KEY']) {
        const r = await exec(conn, `grep "^${varName}=" /www/wwwroot/namainvist.com/.env | head -1 | sed 's/=.*/=***/'`, false);
        const found = r.out.trim() ? '✅' : '❌ MISSING';
        console.log(`  ${varName}: ${found}`);
    }

    // 4. DB stats
    sep('4️⃣  Database Stats');
    await exec(conn, 
        `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema='public';" 2>&1`,
        true
    );
    await exec(conn,
        `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "SELECT COUNT(*) AS remaining_float_cols FROM information_schema.columns WHERE table_schema='public' AND data_type='double precision';" 2>&1`,
        true
    );
    await exec(conn,
        `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "SELECT COUNT(*) AS numeric_cols FROM information_schema.columns WHERE table_schema='public' AND data_type='numeric';" 2>&1`,
        true
    );

    // 5. Remaining double precision (if any)
    const floatRes = await exec(conn,
        `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -t -A -F'|' -c "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND data_type='double precision' ORDER BY 1,2;" 2>&1`,
        false
    );
    const floatRows = floatRes.out.trim().split('\n').filter(r => r.includes('|'));
    if (floatRows.length > 0) {
        sep(`5️⃣  Remaining Float Columns (${floatRows.length})`);
        floatRows.slice(0, 20).forEach(r => console.log('  ⚠️  ' + r));
        if (floatRows.length > 20) console.log(`  ... and ${floatRows.length - 20} more`);
    } else {
        sep('5️⃣  Float Columns → All Migrated! ✅');
    }

    // 6. Check dangerous routes
    sep('6️⃣  Security — Dangerous Routes');
    for (const route of ['/api/seed-company', '/api/system/reset', '/api/check-env']) {
        const r = await exec(conn, `curl -sf --max-time 5 -o /dev/null -w "%{http_code}" https://namainvist.com${route} 2>/dev/null || echo "N/A"`, false);
        const code = r.out.trim();
        const status = code === '503' || code === '405' ? '✅ Blocked' : code === 'N/A' ? '⚠️  N/A' : `⚠️  Returns ${code}`;
        console.log(`  ${route}: ${status}`);
    }

    // 7. Disk space
    sep('7️⃣  Server Resources');
    await exec(conn, 'df -h / | tail -1 && free -h | grep Mem', true);

    // 8. Node.js logs (last 20 lines)
    sep('8️⃣  Recent PM2 Logs (main-site)');
    await exec(conn, 'pm2 logs main-site --lines 15 --nostream 2>&1 | tail -20', true);

    conn.end();
    console.log('\n✅ Audit complete\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
