// Phase 2 — deeper diagnostics for the issues found in pass 1.
const { Client } = require('ssh2');
const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };

function exec(conn, cmd) {
    return new Promise((resolve) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return resolve({ code: -1, stdout: '', stderr: String(err) });
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}
const PG = (sql, db = 'postgres') =>
    `PGPASSWORD="n1_pass123" psql -h localhost -p 5432 -U postgres -d ${db} -t -A -F'|' -c "${sql.replace(/"/g, '\\"')}"`;

async function run() {
    const conn = new Client();
    conn.on('ready', async () => {
        const out = (label, r) => {
            console.log(`\n=== ${label} ===`);
            if (r.stdout) console.log(r.stdout.trim());
            if (r.stderr && !r.stderr.includes('NOTICE') && !r.stderr.includes('TAILING')) console.error('STDERR:', r.stderr.trim());
        };

        try {
            console.log('### A. Redis investigation ###');
            out('redis-cli ping', await exec(conn, 'redis-cli ping 2>&1; redis-cli -p 6379 ping 2>&1'));
            out('redis service', await exec(conn, 'systemctl is-active redis 2>&1; systemctl is-active redis-server 2>&1'));
            out('redis process', await exec(conn, "ps aux | grep -E 'redis' | grep -v grep"));
            out('port 6379 listening', await exec(conn, "ss -tln 2>/dev/null | grep 6379 || echo 'not listening'"));

            console.log('\n### B. PM2 deep state ###');
            out('pm2 list (full)', await exec(conn, 'pm2 list --no-color 2>&1'));

            console.log('\n### C. Subdomains on disk ###');
            out('all sites', await exec(conn, 'ls /www/wwwroot/ 2>&1'));

            const dbs = ['n1_db', 'n7_db', 'n11_db', 'namadb', 'nama_main_db', 'namafoundation_db', 'ahmedalyamicompany_db', 'leave_db', 'm_db', 'mgmg_db', 'shippy_db'];
            for (const db of dbs) {
                console.log(`\n### D. ${db} deep check ###`);
                out(`${db} - settings`,
                    await exec(conn, PG(`SELECT key, LEFT(value, 60) FROM settings WHERE key IN ('zatca_invoice_counter','zatca_last_pih','zatca_environment','company_name','company_vat_number') ORDER BY key;`, db)));
                out(`${db} - users count + last login`,
                    await exec(conn, PG(`SELECT COUNT(*) AS users, MAX(\\\"lastLogin\\\") AS last_login FROM users;`, db)));
                out(`${db} - last 3 journal entries`,
                    await exec(conn, PG(`SELECT id, \\\"entryNumber\\\", \\\"entryDate\\\", status FROM journal_entries ORDER BY id DESC LIMIT 3;`, db)));
                out(`${db} - sales last 30d`,
                    await exec(conn, PG(`SELECT COUNT(*), COALESCE(SUM(total), 0) FROM sales_invoices WHERE \\\"createdAt\\\" >= NOW() - INTERVAL '30 days';`, db)));
                out(`${db} - tenant role`,
                    await exec(conn, PG(`SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname IN ('${db}', '${db.replace('_db','')}_user');`)));
                out(`${db} - sample permissions for ${db} role`,
                    await exec(conn, PG(`SELECT 'users' AS t, has_table_privilege('${db}', 'public.users', 'SELECT') AS sel UNION ALL SELECT 'journal_entries', has_table_privilege('${db}', 'public.journal_entries', 'SELECT') UNION ALL SELECT 'sales_invoices', has_table_privilege('${db}', 'public.sales_invoices', 'SELECT');`, db)));
            }

            console.log('\n### E. Web server health ###');
            out('nginx status', await exec(conn, 'systemctl is-active nginx 2>&1'));
            out('web ports', await exec(conn, "ss -tln 2>/dev/null | grep -E ':80|:443|:3000|:3001|:3007|:3011|:3500|:3600'"));
            out('uptime', await exec(conn, 'uptime'));
            out('memory', await exec(conn, 'free -h | head -3'));

            console.log('\n### F. Build artifacts & .env ###');
            for (const site of ['namainvist.com', 'n1.namainvist.com', 'n11.namainvist.com']) {
                out(`${site} - BUILD_ID`,
                    await exec(conn, `cat /www/wwwroot/${site}/.next/BUILD_ID 2>&1`));
                out(`${site} - env keys`,
                    await exec(conn, `[ -f /www/wwwroot/${site}/.env ] && grep -E '^[A-Z_]+=' /www/wwwroot/${site}/.env | awk -F= '{print $1}' | head -25 || echo 'NO .env'`));
            }
        } catch (err) {
            console.error('FATAL:', err);
        }
        conn.end();
        process.exit(0);
    });
    conn.on('error', e => { console.error('SSH ERROR:', e.message); process.exit(1); });
    conn.connect(SERVER);
}

run();
