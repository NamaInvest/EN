const { Client } = require('ssh2');
const conn = new Client();

const CLERK_SECRET = 'sk_live_btdBcZHEiJ4Et53T81Kb1dVz2TWmYFCMPQ8ClStM6R';

// ما هو البريد المستخدم؟
const TARGET_EMAIL = 'ialqrashi62@gmail.com'; // البريد الذي سجل يشيش

async function deleteClerkUser(email) {
    // ابحث عن المستخدم
    const searchRes = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${CLERK_SECRET}` }
    });
    const users = await searchRes.json();
    console.log('Clerk users found:', JSON.stringify(users?.length || users));
    
    if (!Array.isArray(users) || users.length === 0) {
        console.log('❌ No Clerk user found with email:', email);
        return null;
    }
    
    for (const user of users) {
        console.log(`Deleting Clerk user: ${user.id} (${user.email_addresses?.[0]?.email_address})`);
        const delRes = await fetch(`https://api.clerk.com/v1/users/${user.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${CLERK_SECRET}` }
        });
        const delData = await delRes.json();
        console.log('Delete result:', JSON.stringify(delData));
    }
    return users[0]?.id;
}

deleteClerkUser(TARGET_EMAIL).then(clerkId => {
    console.log('\n✅ Clerk user deleted:', clerkId);
    console.log('Now deleting DB and tenant record via SSH...');
    
    conn.on('ready', () => {
        conn.exec(`
echo "=== Deleting yashish_db ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS yashish_db;"

echo "=== Deleting tenant record from nama_main_db ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -d nama_main_db -c "DELETE FROM tenant_accounts WHERE subdomain='yashish' OR user_email LIKE '%ialqrashi62%';" 2>/dev/null || \
sudo -u postgres psql -h localhost -p 5432 -U postgres -d n11_db -c "DELETE FROM tenant_accounts WHERE subdomain='yashish' OR user_email LIKE '%ialqrashi62%';" 2>/dev/null

echo "=== Verify deletion ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -t -c "SELECT datname FROM pg_database WHERE datname='yashish_db';"
echo "Done - yashish is fully deleted"
        `, (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => {
                console.log('\n🎉 Complete reset done! Can re-register now.');
                conn.end();
            });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
}).catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
