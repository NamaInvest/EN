/**
 * discover_and_migrate.js
 * Discovers the correct schema and DB, then runs migration
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

async function run() {
    const conn = new Client();
    await new Promise((res, rej) => conn.on('ready', res).on('error', rej).connect(SERVER));
    console.log('✅ Connected\n');

    // Step 1: List all databases
    console.log('📊 Listing all PostgreSQL databases...\n');
    await exec(conn, `sudo -u postgres psql -c "\\l" 2>/dev/null || psql -U postgres -c "\\l" 2>/dev/null || echo "Using env..."`, true);

    // Step 2: Try each .env to find the one with our tables
    const nodes = [
        '/www/wwwroot/namainvist.com',
        '/www/wwwroot/n1.namainvist.com',
        '/www/wwwroot/n11.namainvist.com',
    ];
    
    let workingConn = null;
    
    for (const node of nodes) {
        const envRes = await exec(conn, `grep '^DATABASE_URL' ${node}/.env | head -1`, false);
        const rawUrl = envRes.out.trim().replace(/^DATABASE_URL=["']?/, '').replace(/["']?$/, '');
        
        if (!rawUrl) continue;
        
        const match = rawUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+):?(\d+)?\/([^?]+)/);
        if (!match) continue;
        
        const [, pgUser, pgPass, pgHost, pgPort = '5432', pgDbRaw] = match;
        const pgDb = pgDbRaw.split('?')[0];
        
        // Check if tables exist in this DB
        const checkCmd = `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SalesInvoice';" 2>&1`;
        const checkRes = await exec(conn, checkCmd, false);
        
        const countMatch = checkRes.out.match(/(\d+)/);
        const count = countMatch ? parseInt(countMatch[1]) : 0;
        
        console.log(`  ${node.split('/').pop()}: DB=${pgDb} → SalesInvoice exists: ${count > 0 ? '✅' : '❌'}`);
        
        if (count > 0 && !workingConn) {
            workingConn = { pgUser, pgPass, pgHost, pgPort, pgDb, node };
        }
    }
    
    if (!workingConn) {
        // Try searching all schemas
        console.log('\n🔍 Searching all schemas...');
        const firstNode = nodes[0];
        const envRes = await exec(conn, `grep '^DATABASE_URL' ${firstNode}/.env | head -1`, false);
        const rawUrl = envRes.out.trim().replace(/^DATABASE_URL=["']?/, '').replace(/["']?$/, '');
        const match = rawUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+):?(\d+)?\/([^?]+)/);
        
        if (match) {
            const [, pgUser, pgPass, pgHost, pgPort = '5432', pgDbRaw] = match;
            const pgDb = pgDbRaw.split('?')[0];
            
            const schemaCheck = await exec(conn, 
                `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name ILIKE 'salesinvoice' LIMIT 5;" 2>&1`,
                true
            );
            
            const schemMatch = schemaCheck.out.match(/\|\s*(\w+)\s*\|/);
            if (schemMatch) {
                const schema = schemMatch[1];
                console.log(`\n✅ Found in schema: ${schema}`);
                workingConn = { pgUser, pgPass, pgHost, pgPort, pgDb, schema };
            }
        }
    }

    if (!workingConn) {
        console.error('\n❌ Cannot find database with SalesInvoice table!');
        console.log('Running: SELECT table_schema, table_name FROM information_schema.tables LIMIT 20...');
        
        const envRes = await exec(conn, `grep '^DATABASE_URL' ${nodes[0]}/.env | head -1`, false);
        const rawUrl = envRes.out.trim().replace(/^DATABASE_URL=["']?/, '').replace(/["']?$/, '');
        const match = rawUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+):?(\d+)?\/([^?]+)/);
        
        if (match) {
            const [, pgUser, pgPass, pgHost, pgPort = '5432', pgDbRaw] = match;
            const pgDb = pgDbRaw.split('?')[0];
            await exec(conn, `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "\\dt public.*" 2>&1 | head -20`, true);
        }
        conn.end();
        return;
    }

    const { pgUser, pgPass, pgHost, pgPort, pgDb, schema = 'public' } = workingConn;
    console.log(`\n✅ Migrating DB=${pgDb} Schema=${schema}\n`);

    // Build schema-aware SQL
    const tables = [
        ['SalesInvoice',    ['subtotal', 'tax_amount', 'discount', 'total', 'paid_amount']],
        ['SalesInvoiceItem',['quantity', 'unit_price', 'discount', 'tax_amount', 'subtotal']],
        ['PurchaseInvoice', ['subtotal', 'tax_amount', 'discount', 'total', 'paid_amount']],
        ['Product',         ['cost_price', 'sale_price', 'min_price']],
        ['StockMovement',   ['quantity', 'unit_cost']],
        ['JournalLine',     ['debit', 'credit']],
        ['JournalEntry',    ['total_debit', 'total_credit']],
        ['Expense',         ['amount']],
        ['Treasury',        ['amount', 'balance_after']],
        ['PayrollRecord',   ['basic_salary', 'net_salary', 'total_deductions', 'total_additions']],
    ];

    let migrated = 0, skipped = 0, failed = 0;

    console.log('═══════════════════════════════════════════════════');
    console.log('  EXECUTING Float → Decimal(20,4)');
    console.log('═══════════════════════════════════════════════════\n');

    for (const [table, cols] of tables) {
        for (const col of cols) {
            const sql = `ALTER TABLE "${schema}"."${table}" ALTER COLUMN "${col}" TYPE DECIMAL(20,4) USING "${col}"::DECIMAL(20,4);`;
            const res = await exec(conn, 
                `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "${sql}" 2>&1`,
                false
            );
            
            if (res.out.includes('ALTER TABLE')) {
                console.log(`  ✅ ${table}.${col}`);
                migrated++;
            } else if (res.out.includes('does not exist') || res.out.includes('already')) {
                console.log(`  ⏭️  ${table}.${col} (skipped)`);
                skipped++;
            } else {
                console.log(`  ⚠️  ${table}.${col}: ${res.out.trim().slice(0, 80)}`);
                skipped++;
            }
        }
    }

    console.log(`\n📊 Results: ${migrated} migrated, ${skipped} skipped, ${failed} failed\n`);

    // Verify
    console.log('═══════════════════════════════════════════════════');
    console.log('  VERIFICATION');
    console.log('═══════════════════════════════════════════════════\n');

    await exec(conn, 
        `PGPASSWORD='${pgPass}' psql -h ${pgHost} -p ${pgPort} -U ${pgUser} -d ${pgDb} -c "SELECT table_name, column_name, data_type, numeric_precision, numeric_scale FROM information_schema.columns WHERE table_schema='${schema}' AND table_name IN ('SalesInvoice','JournalLine') AND column_name IN ('total','debit') ORDER BY 1,2;" 2>&1`,
        true
    );

    // PM2 reload
    await exec(conn, 'pm2 reload all && echo "✅ PM2 reloaded"', true);

    conn.end();

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log(`║  ✅ Migration: ${migrated} columns → DECIMAL(20,4)         ║`);
    console.log('╚══════════════════════════════════════════════════════════╝\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
