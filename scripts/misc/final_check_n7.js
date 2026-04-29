const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = `
sudo -u postgres psql -d n7_db << 'EOF'
-- ALL user tables in n7_db (any schema)
SELECT table_catalog, table_schema, table_name 
FROM information_schema.tables 
WHERE table_type='BASE TABLE' 
  AND table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY table_schema, table_name
LIMIT 20;
EOF

echo "=== فحص Users في n7_db عبر Prisma مباشر ==="
cd /www/wwwroot/n7.namainvist.com && node << 'NODEEOF'
// Read .env manually 
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const dbLine = env.split('\\n').find(l => l.startsWith('DATABASE_URL='));
console.log('DB from .env:', dbLine);

const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient({ log: ['query'] });
p.user.findMany({ take: 5 })
    .then(users => {
        console.log('Users count:', users.length);
        users.forEach(u => console.log(' -', u.id, u.username, u.role));
        return p.$disconnect();
    })
    .catch(e => {
        console.error('Error:', e.message);
        return p.$disconnect();
    });
NODEEOF
`;
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
