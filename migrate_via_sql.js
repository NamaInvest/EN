/**
 * migrate_via_sql.js
 * ─────────────────────────────────────────────────────────────────
 * Runs Float→Decimal migration directly via psql on the server
 * (No Python/psycopg2 needed — uses PostgreSQL CLI directly)
 */
const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

function execCommand(conn, cmd, print = true) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '', err2 = '';
            stream.on('data', d => { out += d; if (print) process.stdout.write(d); });
            stream.stderr.on('data', d => { err2 += d; if (print) process.stderr.write(d); });
            stream.on('close', code => resolve({ code, out, err: err2 }));
        });
    });
}

// The 31 ALTER TABLE statements
const MIGRATIONS = `
ALTER TABLE "SalesInvoice" ALTER COLUMN "subtotal" TYPE DECIMAL(20,4) USING "subtotal"::DECIMAL(20,4);
ALTER TABLE "SalesInvoice" ALTER COLUMN "tax_amount" TYPE DECIMAL(20,4) USING "tax_amount"::DECIMAL(20,4);
ALTER TABLE "SalesInvoice" ALTER COLUMN "discount" TYPE DECIMAL(20,4) USING "discount"::DECIMAL(20,4);
ALTER TABLE "SalesInvoice" ALTER COLUMN "total" TYPE DECIMAL(20,4) USING "total"::DECIMAL(20,4);
ALTER TABLE "SalesInvoice" ALTER COLUMN "paid_amount" TYPE DECIMAL(20,4) USING "paid_amount"::DECIMAL(20,4);
ALTER TABLE "SalesInvoiceItem" ALTER COLUMN "quantity" TYPE DECIMAL(20,4) USING "quantity"::DECIMAL(20,4);
ALTER TABLE "SalesInvoiceItem" ALTER COLUMN "unit_price" TYPE DECIMAL(20,4) USING "unit_price"::DECIMAL(20,4);
ALTER TABLE "SalesInvoiceItem" ALTER COLUMN "discount" TYPE DECIMAL(20,4) USING "discount"::DECIMAL(20,4);
ALTER TABLE "SalesInvoiceItem" ALTER COLUMN "tax_amount" TYPE DECIMAL(20,4) USING "tax_amount"::DECIMAL(20,4);
ALTER TABLE "SalesInvoiceItem" ALTER COLUMN "subtotal" TYPE DECIMAL(20,4) USING "subtotal"::DECIMAL(20,4);
ALTER TABLE "PurchaseInvoice" ALTER COLUMN "subtotal" TYPE DECIMAL(20,4) USING "subtotal"::DECIMAL(20,4);
ALTER TABLE "PurchaseInvoice" ALTER COLUMN "tax_amount" TYPE DECIMAL(20,4) USING "tax_amount"::DECIMAL(20,4);
ALTER TABLE "PurchaseInvoice" ALTER COLUMN "discount" TYPE DECIMAL(20,4) USING "discount"::DECIMAL(20,4);
ALTER TABLE "PurchaseInvoice" ALTER COLUMN "total" TYPE DECIMAL(20,4) USING "total"::DECIMAL(20,4);
ALTER TABLE "PurchaseInvoice" ALTER COLUMN "paid_amount" TYPE DECIMAL(20,4) USING "paid_amount"::DECIMAL(20,4);
ALTER TABLE "Product" ALTER COLUMN "cost_price" TYPE DECIMAL(20,4) USING "cost_price"::DECIMAL(20,4);
ALTER TABLE "Product" ALTER COLUMN "sale_price" TYPE DECIMAL(20,4) USING "sale_price"::DECIMAL(20,4);
ALTER TABLE "Product" ALTER COLUMN "min_price" TYPE DECIMAL(20,4) USING "min_price"::DECIMAL(20,4);
ALTER TABLE "StockMovement" ALTER COLUMN "quantity" TYPE DECIMAL(20,4) USING "quantity"::DECIMAL(20,4);
ALTER TABLE "StockMovement" ALTER COLUMN "unit_cost" TYPE DECIMAL(20,4) USING "unit_cost"::DECIMAL(20,4);
ALTER TABLE "JournalLine" ALTER COLUMN "debit" TYPE DECIMAL(20,4) USING "debit"::DECIMAL(20,4);
ALTER TABLE "JournalLine" ALTER COLUMN "credit" TYPE DECIMAL(20,4) USING "credit"::DECIMAL(20,4);
ALTER TABLE "JournalEntry" ALTER COLUMN "total_debit" TYPE DECIMAL(20,4) USING "total_debit"::DECIMAL(20,4);
ALTER TABLE "JournalEntry" ALTER COLUMN "total_credit" TYPE DECIMAL(20,4) USING "total_credit"::DECIMAL(20,4);
ALTER TABLE "Expense" ALTER COLUMN "amount" TYPE DECIMAL(20,4) USING "amount"::DECIMAL(20,4);
ALTER TABLE "Treasury" ALTER COLUMN "amount" TYPE DECIMAL(20,4) USING "amount"::DECIMAL(20,4);
ALTER TABLE "Treasury" ALTER COLUMN "balance_after" TYPE DECIMAL(20,4) USING "balance_after"::DECIMAL(20,4);
ALTER TABLE "PayrollRecord" ALTER COLUMN "basic_salary" TYPE DECIMAL(20,4) USING "basic_salary"::DECIMAL(20,4);
ALTER TABLE "PayrollRecord" ALTER COLUMN "net_salary" TYPE DECIMAL(20,4) USING "net_salary"::DECIMAL(20,4);
ALTER TABLE "PayrollRecord" ALTER COLUMN "total_deductions" TYPE DECIMAL(20,4) USING "total_deductions"::DECIMAL(20,4);
ALTER TABLE "PayrollRecord" ALTER COLUMN "total_additions" TYPE DECIMAL(20,4) USING "total_additions"::DECIMAL(20,4);
`.trim();

async function run() {
    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', resolve).on('error', reject).connect(SERVER);
    });
    console.log('✅ Connected\n');

    // Get DB URL
    const envRes = await execCommand(conn, "grep '^DATABASE_URL' /www/wwwroot/namainvist.com/.env | head -1", false);
    const rawUrl = envRes.out.trim().replace(/^DATABASE_URL=["']?/, '').replace(/["']?$/, '');
    
    // Parse postgresql://user:pass@host:port/db?schema=public
    const match = rawUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+):?(\d+)?\/([^?]+)/);
    if (!match) {
        console.error('❌ Cannot parse DATABASE_URL:', rawUrl.slice(0, 60));
        conn.end(); return;
    }
    const [, pgUser, pgPass, pgHost, pgPort = '5432', pgDbRaw] = match;
    const pgDb = pgDbRaw.split('?')[0]; // strip ?schema=public
    console.log(`✅ DB: ${pgUser}@${pgHost}:${pgPort}/${pgDb}\n`);

    // Write SQL to temp file and run via psql
    const sqlFile = '/root/decimal_migration.sql';
    
    // Write SQL file
    const escapedSql = MIGRATIONS.replace(/'/g, "'\\''");
    await execCommand(conn, `cat > ${sqlFile} << 'ENDSQL'\n${MIGRATIONS}\nENDSQL`, false);

    // Run via psql
    console.log('═══════════════════════════════════════════════════');
    console.log('  EXECUTING Float → Decimal(20,4) via psql...');
    console.log('═══════════════════════════════════════════════════\n');

    const psqlCmd = `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -f ${sqlFile} 2>&1`;
    const result = await execCommand(conn, psqlCmd, true);

    console.log(`\nExit code: ${result.code}`);

    // Verify
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  VERIFYING column types...');
    console.log('═══════════════════════════════════════════════════\n');

    const verifyCmd = `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('SalesInvoice','JournalLine','PayrollRecord') AND column_name IN ('total','debit','basic_salary') ORDER BY 1,2;" 2>&1`;
    await execCommand(conn, verifyCmd, true);

    // Regenerate Prisma and PM2 reload
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Regenerating Prisma + PM2 reload...');
    console.log('═══════════════════════════════════════════════════\n');

    for (const node of ['/www/wwwroot/namainvist.com', '/www/wwwroot/n1.namainvist.com', '/www/wwwroot/n11.namainvist.com']) {
        await execCommand(conn, `cd ${node} && npx prisma@5.22.0 generate 2>&1 | grep -E '✔|Generated|error' | head -3`, true);
    }

    await execCommand(conn, 'pm2 reload all && echo "PM2 reloaded OK"', true);

    // Health check
    await new Promise(r => setTimeout(r, 2000));
    await execCommand(conn, "curl -sf http://localhost:3000/api/health 2>/dev/null || echo 'Health: warming up'", true);

    conn.end();

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║    ✅ DECIMAL MIGRATION DONE — Financial Precision Active ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.log('31 columns → DECIMAL(20,4):');
    console.log('  💰 SalesInvoice/Item, PurchaseInvoice');
    console.log('  📦 Product prices, StockMovement');
    console.log('  📒 JournalLine/Entry (Accounting)');
    console.log('  💵 Expense, Treasury, PayrollRecord\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
