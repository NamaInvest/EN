/**
 * fix_remaining_floats.js
 * Fix the 12 remaining float columns using correct column names (lowercase in DB)
 */
const { Client } = require('ssh2');
const pgUser = 'postgres', pgPass = 'RootPassNama1', pgHost = 'localhost', pgPort = '5432', pgDb = 'n11_db';
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

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

    // Get exact column names from DB (they might be camelCase stored as lowercase)
    console.log('🔍 Finding remaining double precision columns with exact names...\n');
    const res = await exec(conn,
        `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -t -A -F'|' -c "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND data_type='double precision' ORDER BY 1,2;" 2>&1`,
        false
    );

    const rows = res.out.trim().split('\n').filter(r => r.includes('|'));
    console.log(`Found ${rows.length} remaining float columns:\n`);
    rows.forEach(r => console.log('  ' + r));
    console.log();

    if (rows.length === 0) {
        console.log('✅ No remaining float columns!');
        conn.end();
        return;
    }

    // Migrate each one using exact names from information_schema
    let migrated = 0, skipped = 0;
    for (const row of rows) {
        const [table, col] = row.split('|');
        // Try with quoted table name (case-insensitive match)
        const sql = `ALTER TABLE "${table}" ALTER COLUMN "${col}" TYPE NUMERIC(20,4) USING "${col}"::NUMERIC(20,4);`;
        const cmd = `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "${sql}" 2>&1`;
        const result = await exec(conn, cmd, false);

        if (result.out.includes('ALTER TABLE')) {
            console.log(`  ✅ "${table}"."${col}" → NUMERIC(20,4)`);
            migrated++;
        } else {
            const msg = result.out.trim().slice(0, 100);
            console.log(`  ⏭️  "${table}"."${col}": ${msg}`);
            skipped++;
        }
    }

    console.log(`\n📊 Final: ${migrated} migrated, ${skipped} skipped`);

    // Final count
    const finalRes = await exec(conn,
        `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -t -A -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND data_type='double precision';" 2>&1`,
        false
    );
    console.log(`\n📊 Remaining double precision columns: ${finalRes.out.trim()}`);

    // Check app health
    console.log('\n🔍 Health check via localhost...');
    await exec(conn, "curl -sf --max-time 10 http://localhost:3000/api/health 2>/dev/null || echo 'Still starting...'", true);

    // PM2 status
    console.log('\n📊 PM2 Status:');
    await exec(conn, 'pm2 list 2>&1 | grep -E "name|online|errored|stopped"', true);

    conn.end();
    console.log('\n✅ Done\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
