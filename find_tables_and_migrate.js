/**
 * find_tables_and_migrate.js
 * Checks actual table names in n11_db and runs migration
 */
const { Client } = require('ssh2');

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

// DB credentials from previous run
const pgUser = 'postgres';
const pgPass = 'RootPassNama1';
const pgHost = 'localhost';
const pgPort = '5432';
const pgDb   = 'n11_db'; // discovered from .env

async function run() {
    const conn = new Client();
    await new Promise((res, rej) => conn.on('ready', res).on('error', rej).connect(SERVER));
    console.log('✅ Connected\n');

    // Step 1: Find invoice-related tables
    console.log('🔍 Finding financial tables in n11_db...\n');
    await exec(conn, 
        `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name ILIKE '%invoice%' OR table_name ILIKE '%journal%' OR table_name ILIKE '%product%' OR table_name ILIKE '%payroll%' OR table_name ILIKE '%treasury%' OR table_name ILIKE '%expense%' OR table_name ILIKE '%stock%') ORDER BY table_name;" 2>&1`,
        true
    );

    // Step 2: Check actual column types for sales-related tables
    console.log('\n🔍 Checking current column types (looking for Float/double precision)...\n');
    await exec(conn, 
        `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND data_type IN ('real','double precision') ORDER BY table_name, column_name LIMIT 50;" 2>&1`,
        true
    );

    conn.end();
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
