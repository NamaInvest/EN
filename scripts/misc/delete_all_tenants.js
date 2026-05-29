const { Client } = require('ssh2');
const conn = new Client();
const CLERK_SECRET = 'sk_live_btdBcZHEiJ4Et53T81Kb1dVz2TWmYFCMPQ8ClStM6R';

async function deleteAllClerkUsers() {
    const res = await fetch('https://api.clerk.com/v1/users?limit=50', {
        headers: { Authorization: `Bearer ${CLERK_SECRET}` }
    });
    const users = await res.json();
    console.log(`Found ${users.length} Clerk users`);
    for (const user of users) {
        const email = user.email_addresses?.[0]?.email_address || '';
        const del = await fetch(`https://api.clerk.com/v1/users/${user.id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${CLERK_SECRET}` }
        });
        const r = await del.json();
        console.log(`✅ Deleted: ${email} → ${r.deleted ? 'OK' : JSON.stringify(r)}`);
    }
}

deleteAllClerkUsers().then(() => {
    conn.on('ready', () => {
        conn.exec(`
echo "=== Deleting all SaaS tenant DBs ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS yessip_db;"
sudo -u postgres psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS theaccountantgrew_db;"

echo "=== Clearing tenant_accounts ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -d n11_db -t -c "DELETE FROM tenant_accounts;" 2>/dev/null
sudo -u postgres psql -h localhost -p 5432 -U postgres -d nama_main_db -t -c "DELETE FROM tenant_accounts;" 2>/dev/null

echo "=== Remaining DBs ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -t -c "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres','template0','template1','n11_db','n1_db','n2_db','n3_db','n4_db','n5_db','n6_db','n7_db','n8_db','n9_db','n10_db','11_db','23_db','nama_main_db','test_db_final') ORDER BY datname;"
echo "✅ All tenant DBs deleted - system is clean"
        `, (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => { console.log('🎉 Done!'); conn.end(); });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
}).catch(console.error);
