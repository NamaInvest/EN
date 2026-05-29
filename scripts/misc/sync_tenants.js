const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    // First write the SQL file to the server
    c.sftp((e, sftp) => {
        const sql = `
DO $$
DECLARE
    db_name TEXT;
    sub TEXT;
BEGIN
    FOR db_name IN 
        SELECT datname FROM pg_database 
        WHERE datname LIKE '%_db' 
        AND datname NOT IN ('n11_db', 'nama_main_db', 'leave_db')
        AND datname NOT IN (SELECT subdomain || '_db' FROM tenant_accounts)
    LOOP
        sub := REPLACE(db_name, '_db', '');
        INSERT INTO tenant_accounts (
            user_email, org_name, vat_number, subdomain, 
            status, created_at, updated_at, payment_status, 
            subscription_duration, subscription_status, plan
        ) VALUES (
            sub || '@namainvist.com',
            sub,
            '---',
            sub,
            'active',
            NOW(),
            NOW(),
            'pending',
            '1_year',
            'trial',
            'free'
        ) ON CONFLICT (subdomain) DO NOTHING;
        RAISE NOTICE 'Synced: %', sub;
    END LOOP;
END $$;

SELECT id, subdomain, org_name, user_email, status, subscription_status, plan FROM tenant_accounts ORDER BY id;
`;
        sftp.writeFile('/tmp/sync_tenants.sql', sql, () => {
            console.log('SQL file written');
            sftp.end();
            c.exec('psql "postgresql://n11_db:n11_pass123@localhost:5432/n11_db" -f /tmp/sync_tenants.sql', (e, s) => {
                let o = '';
                s.on('data', d => o += d.toString());
                s.stderr.on('data', d => o += d.toString());
                s.on('close', () => {
                    console.log(o);
                    c.end();
                });
            });
        });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'process.env.SSH_PASSWORD'});
