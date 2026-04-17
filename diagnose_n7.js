const { Client } = require('ssh2');
const conn = new Client();
const N7 = '/www/wwwroot/n7.namainvist.com';

conn.on('ready', () => {
    const cmd = `
echo "=== كم عدد الـ models في schema.prisma ==="
grep -c '^model ' ${N7}/prisma/schema.prisma

echo "=== أول 5 models ==="
grep '^model ' ${N7}/prisma/schema.prisma | head -5

echo "=== ALL schemas in n7_db ==="
sudo -u postgres psql -d n7_db -c "SELECT schema_name FROM information_schema.schemata;" 2>/dev/null

echo "=== Tables in ALL schemas ==="
sudo -u postgres psql -d n7_db -c "SELECT schemaname, count(*) FROM pg_tables GROUP BY schemaname;" 2>/dev/null

echo "=== محاولة مباشرة بـ psql SQL ==="
sudo -u postgres psql -d n7_db << 'PSQLEOF'
CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name TEXT);
INSERT INTO test_table (name) VALUES ('test');
SELECT * FROM test_table;
DROP TABLE test_table;
PSQLEOF
`;

    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
