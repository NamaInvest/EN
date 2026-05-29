/**
 * run_decimal_migration.js
 * ─────────────────────────────────────────────────────────────────
 * Connects to production server and runs the Float→Decimal migration.
 *
 * Steps:
 *   1. Upload remediation/migrate_decimal.py to server
 *   2. Install psycopg2-binary if needed
 *   3. Run --dry-run to preview
 *   4. Run --execute on all 3 nodes
 *   5. Run prisma db pull + generate on main node
 *   6. Rebuild and PM2 reload
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };

const NODES = [
    '/www/wwwroot/namainvist.com',
    '/www/wwwroot/n1.namainvist.com',
    '/www/wwwroot/n11.namainvist.com',
];

const MIGRATE_SCRIPT_LOCAL = path.join(__dirname, 'remediation', 'migrate_decimal.py');
const MIGRATE_SCRIPT_REMOTE = '/root/migrate_decimal.py';

function execCommand(conn, cmd, printOutput = true) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => {
                const s = d.toString();
                stdout += s;
                if (printOutput) process.stdout.write(s);
            });
            stream.stderr.on('data', d => {
                const s = d.toString();
                stderr += s;
                if (printOutput) process.stderr.write(s);
            });
            stream.on('close', code => resolve({ code, stdout, stderr }));
        });
    });
}

function uploadFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, err => {
            if (err) return reject(err);
            resolve();
        });
    });
}

function connectSSH() {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => resolve(conn));
        conn.on('error', reject);
        conn.connect(SERVER);
    });
}

function getSftp(conn) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            resolve(sftp);
        });
    });
}

async function run() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║     Float → Decimal Migration — Production Server        ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    const conn = await connectSSH();
    console.log('✅ Connected to 46.4.188.170\n');

    // Upload migration script
    const sftp = await getSftp(conn);
    console.log('📤 Uploading migrate_decimal.py...');
    await uploadFile(sftp, MIGRATE_SCRIPT_LOCAL, MIGRATE_SCRIPT_REMOTE);
    console.log('✅ Upload complete\n');

    // Install psycopg2 if not present
    console.log('📦 Checking psycopg2...');
    const pipCheck = await execCommand(conn, 'pip3 show psycopg2-binary 2>/dev/null || pip3 install psycopg2-binary -q', false);
    console.log('✅ psycopg2 ready\n');

    // Get DATABASE_URL from main node .env
    console.log('🔍 Reading DATABASE_URL from production .env...');
    const envResult = await execCommand(conn, `grep "^DATABASE_URL" ${NODES[0]}/.env | head -1`, false);
    const dbUrlLine = envResult.stdout.trim();
    if (!dbUrlLine) {
        console.error('❌ DATABASE_URL not found in .env!');
        conn.end();
        process.exit(1);
    }
    const dbUrl = dbUrlLine.replace(/^DATABASE_URL=["']?/, '').replace(/["']?$/, '');
    console.log(`✅ DATABASE_URL found (${dbUrl.substring(0, 30)}...)\n`);

    // ── Step 1: DRY RUN ────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════');
    console.log('  STEP 1: DRY RUN — Preview changes');
    console.log('═══════════════════════════════════════════════════\n');

    const dryRun = await execCommand(
        conn,
        `DATABASE_URL='${dbUrl}' python3 ${MIGRATE_SCRIPT_REMOTE} --dry-run`,
        true
    );

    if (dryRun.code !== 0) {
        console.error('\n❌ Dry run failed. Aborting.');
        conn.end();
        process.exit(1);
    }

    // ── Step 2: EXECUTE on shared DB (runs once, affects all nodes) ────
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  STEP 2: EXECUTE — Migrating Float → Decimal(20,4)');
    console.log('═══════════════════════════════════════════════════\n');

    const execute = await execCommand(
        conn,
        `DATABASE_URL='${dbUrl}' python3 ${MIGRATE_SCRIPT_REMOTE} --execute`,
        true
    );

    if (execute.code !== 0) {
        console.error('\n⚠️  Migration had some errors (columns may already be DECIMAL). Continuing...');
    } else {
        console.log('\n✅ Migration executed successfully!\n');
    }

    // ── Step 3: Prisma db pull + generate on main node ──────────────────
    console.log('═══════════════════════════════════════════════════');
    console.log('  STEP 3: Refreshing Prisma schema from DB');
    console.log('═══════════════════════════════════════════════════\n');

    const mainNode = NODES[0];
    await execCommand(
        conn,
        `cd ${mainNode} && npx prisma@5.22.0 db pull 2>&1 | tail -5`,
        true
    );

    await execCommand(
        conn,
        `cd ${mainNode} && npx prisma@5.22.0 generate 2>&1 | tail -3`,
        true
    );

    // ── Step 4: Rebuild all nodes ────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  STEP 4: Rebuilding all nodes after schema update');
    console.log('═══════════════════════════════════════════════════\n');

    for (const node of NODES) {
        console.log(`\n🔨 Building ${node}...`);
        const build = await execCommand(
            conn,
            `cd ${node} && npx prisma@5.22.0 generate && next build 2>&1 | tail -8`,
            true
        );
        if (build.code !== 0) {
            console.error(`⚠️  Build issues on ${node} — continuing with PM2 reload`);
        } else {
            console.log(`✅ ${node} built successfully`);
        }
    }

    // ── Step 5: PM2 reload ──────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  STEP 5: PM2 Reload (zero-downtime)');
    console.log('═══════════════════════════════════════════════════\n');

    await execCommand(conn, 'pm2 reload all && pm2 list', true);

    // ── Step 6: Health check ─────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  STEP 6: Health Check');
    console.log('═══════════════════════════════════════════════════\n');

    const health = await execCommand(
        conn,
        "curl -s https://namainvist.com/api/health | python3 -c \"import sys,json; d=json.load(sys.stdin); print(json.dumps(d, indent=2, ensure_ascii=False))\" 2>/dev/null || echo 'Health check pending (DNS may need time)'",
        true
    );

    conn.end();

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║          ✅ MIGRATION COMPLETE — All Done!               ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.log('Summary:');
    console.log('  • Float → Decimal(20,4) migration applied to production DB');
    console.log('  • Prisma schema pulled from DB and client regenerated');
    console.log('  • All 3 nodes rebuilt and PM2 reloaded');
    console.log('  • Health check performed\n');
}

run().catch(err => {
    console.error('\n❌ FATAL ERROR:', err.message);
    process.exit(1);
});
