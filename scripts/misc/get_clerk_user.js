const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(
        'grep CLERK_SECRET_KEY /www/wwwroot/namainvist.com/.env 2>/dev/null | head -1',
        (err, stream) => {
            let clerkKey = '';
            stream.on('data', d => { clerkKey += d.toString().trim(); });
            stream.on('close', () => {
                const key = clerkKey.split('=').slice(1).join('=').replace(/['"]/g, '').trim();
                console.log('Key prefix:', key.slice(0, 20));
                
                // Fetch from Clerk API
                const https = require('https');
                const options = {
                    hostname: 'api.clerk.com',
                    path: '/v1/users?email_address=ialqrashi62%40gmail.com&limit=5',
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${key}` }
                };
                const req = https.request(options, res => {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        try {
                            const users = JSON.parse(body);
                            if (Array.isArray(users) && users.length > 0) {
                                users.forEach(u => {
                                    const email = u.email_addresses?.[0]?.email_address;
                                    console.log(`User: ${u.id} | ${email}`);
                                });
                            } else {
                                console.log('No users found. Response:', body.slice(0, 200));
                            }
                        } catch(e) {
                            console.log('Parse error:', e.message, body.slice(0,200));
                        }
                        conn.end();
                    });
                });
                req.on('error', e => { console.error(e); conn.end(); });
                req.end();
            });
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
