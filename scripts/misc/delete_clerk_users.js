const CLERK_SECRET = 'sk_live_btdBcZHEiJ4Et53T81Kb1dVz2TWmYFCMPQ8ClStM6R';

async function run() {
    // احذف كلا المستخدمين
    const emails = ['ialqrashi62@gmail.com', 'tntm431@gmail.com'];
    
    for (const email of emails) {
        const res = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
            headers: { Authorization: `Bearer ${CLERK_SECRET}` }
        });
        const users = await res.json();
        if (Array.isArray(users) && users.length > 0) {
            for (const user of users) {
                const del = await fetch(`https://api.clerk.com/v1/users/${user.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${CLERK_SECRET}` }
                });
                const r = await del.json();
                console.log(`✅ Deleted ${email}: ${r.deleted ? 'OK' : JSON.stringify(r)}`);
            }
        } else {
            console.log(`⚠️ Not found in Clerk: ${email}`);
        }
    }
}

run().catch(console.error);
