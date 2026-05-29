/**
 * Apply numbering_sequences migration to ALL tenant DBs.
 * Migration SQL is idempotent (CREATE TABLE IF NOT EXISTS, ON CONFLICT DO NOTHING),
 * so re-running on n11_db (already migrated) is safe.
 */

const { Client } = require('ssh2');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' };
const REMOTE = '/www/wwwroot/n11.namainvist.com';
const MIGRATION_SQL = 'prisma/migrations/20260501_add_numbering_sequences/migration.sql';

// nama_main_db is owned by `postgres` and the n11_db connection role lacks CREATE
// on its public schema. Skipping until the user explicitly authorizes a GRANT.
const TENANTS = [
    'ahmedalyamicompany_db',
    'leave_db',
    'm_db',
    'n11_db',
    'n7_db',
];

const conn = new Client();
conn.on('error', e => { console.error('SSH error:', e.message); process.exit(1); });

conn.on('ready', async () => {
    console.log(`🔌 Connected to ${SERVER.host}\n`);
    const failed = [];
    const succeeded = [];

    for (const tenantDb of TENANTS) {
        console.log(`━━━ Applying to: ${tenantDb} ━━━`);
        // Build a DATABASE_URL pointing at this specific tenant DB
        const cmd = `cd ${REMOTE} && BASE_URL="$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/?.*$//')" && TENANT_URL="$(echo "$BASE_URL" | sed 's|/[^/]*$|/${tenantDb}|')" && psql "$TENANT_URL" -f ${MIGRATION_SQL} 2>&1`;
        const out = await runCommand(cmd);

        const trimmed = out.trim();
        console.log(trimmed);

        const looksOk = (trimmed.includes('CREATE TABLE') || trimmed.includes('already exists'))
                     && (trimmed.includes('INSERT 0') || trimmed.includes('CREATE INDEX'));
        const looksError = trimmed.toLowerCase().includes('error') && !trimmed.includes('already exists');

        if (looksError && !looksOk) {
            failed.push({ db: tenantDb, output: trimmed });
            console.log(`❌ FAILED on ${tenantDb}\n`);
        } else {
            succeeded.push(tenantDb);
            console.log(`✅ OK\n`);
        }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Succeeded (${succeeded.length}): ${succeeded.join(', ')}`);
    if (failed.length > 0) {
        console.log(`❌ Failed (${failed.length}):`);
        failed.forEach(f => console.log(`  - ${f.db}: ${f.output.slice(-200)}`));
    }

    // Verify counts
    console.log('\n━━━ Verification (row counts per tenant) ━━━');
    for (const tenantDb of TENANTS) {
        const cmd = `cd ${REMOTE} && BASE_URL="$(grep '^DATABASE_URL' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | sed 's/?.*$//')" && TENANT_URL="$(echo "$BASE_URL" | sed 's|/[^/]*$|/${tenantDb}|')" && psql "$TENANT_URL" -t -c "SELECT COUNT(*) FROM numbering_sequences;" 2>&1`;
        const out = await runCommand(cmd);
        console.log(`  ${tenantDb}: ${out.trim()} rows`);
    }

    conn.end();
});

function runCommand(cmd) {
    return new Promise((res, rej) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return rej(err);
            let out = '';
            stream.on('data', d => out += d);
            stream.stderr.on('data', d => out += d);
            stream.on('close', () => res(out));
        });
    });
}

conn.connect(SERVER);
