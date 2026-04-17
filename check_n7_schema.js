const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
sudo -u postgres psql -d n7_db << 'EOF'
SET search_path TO public;
SELECT count(*) as total_tables FROM information_schema.tables WHERE table_schema='public';
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename LIMIT 10;
SELECT id, username, "fullName", role FROM "User" LIMIT 5;
EOF
`;
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
