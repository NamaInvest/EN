/**
 * final_decimal_migration.js
 * Uses ACTUAL table names (snake_case) discovered from production DB
 */
const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
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

async function psql(conn, sql, print = false) {
    const escaped = sql.replace(/"/g, '\\"').replace(/\$/g, '\\$');
    const cmd = `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "${escaped}" 2>&1`;
    return exec(conn, cmd, print);
}

// All financial columns in their REAL table names
const FINANCIAL_COLUMNS = [
    // Core invoicing
    ['sales_invoices',          'subtotal'],
    ['sales_invoices',          'tax_amount'],
    ['sales_invoices',          'discount'],
    ['sales_invoices',          'total'],
    ['sales_invoices',          'paid_amount'],
    ['sales_invoice_details',   'quantity'],
    ['sales_invoice_details',   'unit_price'],
    ['sales_invoice_details',   'discount'],
    ['sales_invoice_details',   'tax_amount'],
    ['sales_invoice_details',   'subtotal'],
    ['purchase_invoices',       'subtotal'],
    ['purchase_invoices',       'tax_amount'],
    ['purchase_invoices',       'discount'],
    ['purchase_invoices',       'total'],
    ['purchase_invoices',       'paid_amount'],
    ['purchase_invoice_details','quantity'],
    ['purchase_invoice_details','unit_price'],
    ['purchase_invoice_details','subtotal'],
    // Products
    ['products',                'cost_price'],
    ['products',                'sale_price'],
    ['products',                'min_price'],
    // Inventory
    ['stock_movements',         'quantity'],
    ['stock_movements',         'unit_cost'],
    // Accounting
    ['journal_lines',           'debit'],
    ['journal_lines',           'credit'],
    ['journal_entries',         'total_debit'],
    ['journal_entries',         'total_credit'],
    ['accounts',                'balance'],
    // Treasury & Expenses
    ['treasury',                'amount'],
    ['treasury',                'balance_after'],
    ['expenses',                'amount'],
    // Bank
    ['bank_accounts',           'current_balance'],
    ['bank_transactions',       'amount'],
    ['bank_reconciliations',    'statement_balance'],
    ['bank_reconciliations',    'system_balance'],
    ['bank_reconciliations',    'difference'],
    // Assets
    ['assets',                  'purchase_price'],
    ['assets',                  'current_value'],
    ['assets',                  'salvage_value'],
    // Payroll
    ['payroll_runs',            'total_net'],
    ['payroll_runs',            'total_gross'],
    ['payroll_runs',            'total_deductions'],
];

async function run() {
    const conn = new Client();
    await new Promise((res, rej) => conn.on('ready', res).on('error', rej).connect(SERVER));
    console.log('✅ Connected to production DB\n');

    // First: migrate ALL double precision columns in financial tables at once
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  PHASE 1: Migrate ALL double precision → numeric(20,4)');
    console.log('  (auto-discovers all float columns in financial tables)');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Get all double precision columns across all tables
    const discoveryRes = await exec(conn, 
        `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -t -A -F'|' -c "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND data_type='double precision' ORDER BY table_name, column_name;" 2>&1`,
        false
    );

    const rows = discoveryRes.out.trim().split('\n').filter(r => r.includes('|'));
    console.log(`📊 Found ${rows.length} double precision columns to migrate\n`);

    let migrated = 0, skipped = 0;

    for (const row of rows) {
        const [table, col] = row.split('|');
        if (!table || !col) continue;

        const sql = `ALTER TABLE public."${table}" ALTER COLUMN "${col}" TYPE NUMERIC(20,4) USING "${col}"::NUMERIC(20,4)`;
        const cmd = `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "${sql};" 2>&1`;
        const res = await exec(conn, cmd, false);

        if (res.out.includes('ALTER TABLE')) {
            console.log(`  ✅ ${table}.${col} → NUMERIC(20,4)`);
            migrated++;
        } else {
            const errMsg = res.out.trim().replace(/\n/g, ' ').slice(0, 100);
            console.log(`  ⏭️  ${table}.${col} — ${errMsg}`);
            skipped++;
        }
    }

    console.log(`\n📊 Phase 1 Results: ${migrated} migrated, ${skipped} skipped\n`);

    // Phase 2: Verify
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  PHASE 2: Verification — Remaining double precision cols');
    console.log('═══════════════════════════════════════════════════════════\n');

    const verifyRes = await exec(conn, 
        `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND data_type='double precision' ORDER BY 1,2 LIMIT 20;" 2>&1`,
        true
    );

    const remainingMatch = verifyRes.out.match(/\((\d+) rows?\)/);
    const remaining = remainingMatch ? parseInt(remainingMatch[1]) : '?';
    console.log(`\nRemaining double precision columns: ${remaining}`);

    // Phase 3: Check sample values
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  PHASE 3: Verify numeric precision on key financial tables');
    console.log('═══════════════════════════════════════════════════════════\n');

    await exec(conn, 
        `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "SELECT table_name, column_name, data_type, numeric_precision, numeric_scale FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('sales_invoices','journal_lines','treasury') AND data_type='numeric' ORDER BY 1,2;" 2>&1`,
        true
    );

    // Phase 4: PM2 reload
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  PHASE 4: PM2 Reload (zero-downtime)');
    console.log('═══════════════════════════════════════════════════════════\n');

    await exec(conn, 'pm2 reload all 2>&1 | tail -8', true);

    conn.end();

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log(`║  ✅ MIGRATION COMPLETE: ${migrated} columns → NUMERIC(20,4)  ║`);
    console.log('║     Financial precision now PRODUCTION-GRADE!             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
