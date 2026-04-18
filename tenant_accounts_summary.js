const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Step 1: Get all subdomains from tenant_accounts
    conn.exec(
        "psql -U n11_db -h localhost -d n11_db -t -c \"SELECT id, subdomain, user_email, org_name, status, created_at FROM tenant_accounts ORDER BY id;\" 2>/dev/null",
        (err, stream) => {
            let rows = '';
            stream.on('data', d => rows += d.toString());
            stream.on('close', () => {
                console.log('=== tenant_accounts ===');
                const lines = rows.split('\n').map(l => l.trim()).filter(l => l.includes('|'));
                
                if (lines.length === 0) {
                    console.log('لا توجد سجلات في tenant_accounts');
                    conn.end();
                    return;
                }

                lines.forEach(line => {
                    const cols = line.split('|').map(c => c.trim());
                    console.log(`ID: ${cols[0]} | Subdomain: ${cols[1]} | Email: ${cols[2]} | Org: ${cols[3]} | Status: ${cols[4]} | Created: ${cols[5]}`);
                });

                const subdomains = lines.map(l => l.split('|')[1]?.trim()).filter(Boolean);
                console.log(`\n✅ إجمالي الحسابات: ${subdomains.length}`);

                // Step 2: Check each DB
                console.log('\n=== قواعد البيانات المرتبطة ===');
                let checked = 0;
                
                if (subdomains.length === 0) { conn.end(); return; }
                
                subdomains.forEach(sub => {
                    const dbName = `${sub}_db`;
                    conn.exec(
                        `psql -U n11_db -h localhost -d ${dbName} -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "NOT_FOUND"`,
                        (e, s) => {
                            let out = '';
                            s.on('data', d => out += d.toString());
                            s.on('close', () => {
                                const count = out.trim().replace('NOT_FOUND', '❌ غير موجودة');
                                console.log(`  ${dbName}: ${count.includes('❌') ? '❌ قاعدة بيانات غير موجودة' : `✅ ${count.trim()} مستخدم`}`);
                                checked++;
                                if (checked === subdomains.length) conn.end();
                            });
                        }
                    );
                });
            });
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
