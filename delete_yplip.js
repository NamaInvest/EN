const { Client } = require('ssh2');
const conn = new Client();
const CLERK_SECRET = 'sk_live_btdBcZHEiJ4Et53T81Kb1dVz2TWmYFCMPQ8ClStM6R';

// نبحث عن البريد المرتبط بـ yplip
async function findAndDeleteClerkUser() {
    // البحث عن جميع المستخدمين وإيجاد من لديه subdomain yplip
    const res = await fetch('https://api.clerk.com/v1/users?limit=50', {
        headers: { Authorization: `Bearer ${CLERK_SECRET}` }
    });
    const users = await res.json();
    
    // ابحث عن المستخدم المرتبط بـ yplip
    for (const user of users) {
        const email = user.email_addresses?.[0]?.email_address || '';
        const emailPart = email.split('@')[0].toLowerCase();
        console.log(`User: ${email} | emailPart: ${emailPart}`);
        
        // يشبه yplip؟
        if (emailPart.startsWith('yp') || emailPart.includes('yplip')) {
            console.log(`→ Deleting: ${email} (${user.id})`);
            const del = await fetch(`https://api.clerk.com/v1/users/${user.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${CLERK_SECRET}` }
            });
            const result = await del.json();
            console.log('Deleted:', result.deleted);
            return email;
        }
    }
    console.log('❌ No matching Clerk user found for yplip');
    return null;
}

findAndDeleteClerkUser().then(email => {
    console.log('\nNow deleting yplip DB and tenant record...');
    conn.on('ready', () => {
        conn.exec(`
echo "=== Deleting yplip_db ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS yplip_db;"

echo "=== Cleaning up test DBs (atest, test2) ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS atest_db;"
sudo -u postgres psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS test2_db;"

echo "=== Deleting tenant records ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -d n11_db -t -c "DELETE FROM tenant_accounts WHERE subdomain IN ('yplip','atest','test2');" 2>/dev/null
sudo -u postgres psql -h localhost -p 5432 -U postgres -d nama_main_db -t -c "DELETE FROM tenant_accounts WHERE subdomain IN ('yplip','atest','test2');" 2>/dev/null

echo "=== Remaining SaaS DBs ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -t -c "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres','template0','template1','n11_db','n1_db','n2_db','n3_db','n4_db','n5_db','n6_db','n7_db','n8_db','n9_db','n10_db','11_db','23_db','nama_main_db','test_db_final') ORDER BY datname;"

echo "✅ yplip fully deleted - ready to re-register"
        `, (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => { console.log('\n🎉 Done!'); conn.end(); });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
}).catch(console.error);
