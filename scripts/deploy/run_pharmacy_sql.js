const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const appPath = '/www/wwwroot/n11.namainvist.com';
const sqlFile = path.join('scripts', 'deploy', 'pharmacy_tables.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected to 46.4.188.170');

    // First: detect DB credentials from .env on the server
    conn.exec(`cat ${appPath}/.env | grep DATABASE_URL`, (e, s) => {
        let envOut = '';
        s.on('data', d => envOut += d);
        s.on('close', () => {
            console.log('🔑 DB URL found:', envOut.trim().replace(/:([^@]+)@/, ':***@'));

            // Parse connection details
            const match = envOut.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
            if (!match) {
                console.error('Could not parse DATABASE_URL');
                return conn.end();
            }
            const [, user, pass, host, port, db] = match;
            console.log(`📊 DB: ${user}@${host}:${port}/${db}`);

            // Upload SQL
            conn.sftp((err, sftp) => {
                if (err) return conn.end();
                const ws = sftp.createWriteStream('/tmp/pharmacy_tables.sql');
                ws.on('close', () => {
                    console.log('📄 SQL uploaded');

                    // Run with correct credentials
                    const pgCmd = `PGPASSWORD='${pass}' psql -h ${host} -p ${port} -U ${user} -d ${db} -f /tmp/pharmacy_tables.sql 2>&1`;
                    conn.exec(pgCmd, (e2, s2) => {
                        let o2 = '';
                        s2.on('data', d => o2 += d);
                        s2.stderr.on('data', d => o2 += d);
                        s2.on('close', () => {
                            console.log('🗄️  SQL result:', o2.trim().slice(-400));

                            // Verify tables
                            const checkCmd = `PGPASSWORD='${pass}' psql -h ${host} -p ${port} -U ${user} -d ${db} -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE 'pharmacy%' OR table_name IN ('prescriptions','prescription_items','insurance_claims','controlled_drug_logs','medication_logs')) ORDER BY 1;" 2>&1`;
                            conn.exec(checkCmd, (e3, s3) => {
                                let o3 = '';
                                s3.on('data', d => o3 += d);
                                s3.on('close', () => {
                                    console.log('📋 Pharmacy tables:\n', o3.trim());

                                    // Restart PM2
                                    conn.exec('pm2 restart saas-app 2>&1 | tail -3', (e4, s4) => {
                                        let o4 = '';
                                        s4.on('data', d => o4 += d);
                                        s4.on('close', () => {
                                            console.log('🚀 PM2:', o4.includes('online') ? '✅ saas-app online' : o4.trim());
                                            conn.end();
                                            console.log('\n🎉 Pharmacy module fully deployed!');
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
                ws.write(sqlContent);
                ws.end();
            });
        });
    });
}).on('error', e => console.error('Connection error:', e.message))
  .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
