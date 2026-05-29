const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(
        `psql -U n11_db -h localhost -d n11_db -c "
INSERT INTO tenant_accounts (clerk_user_id, user_email, org_name, vat_number, subdomain, status, payment_status, subscription_duration)
VALUES ('user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs', 'ialqrashi62@gmail.com', 'نما انفست', '300000000000003', 'namainvest', 'active', 'paid', '1_year')
ON CONFLICT (user_email) DO UPDATE SET
    clerk_user_id = EXCLUDED.clerk_user_id,
    subdomain = EXCLUDED.subdomain,
    status = 'active'
RETURNING *;" 2>/dev/null`,
        (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => {
                console.log('\n✅ Done!');
                conn.end();
            });
        }
    );
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
