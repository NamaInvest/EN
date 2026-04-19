const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    // Check 1: Recent logs for provisioning errors
    c.exec('pm2 logs main-site --lines 20 --nostream 2>/dev/null | grep -i "provision\\|upsert\\|error"', (e, s) => {
        let o = '';
        s.on('data', d => o += d.toString());
        s.stderr.on('data', d => o += d.toString());
        s.on('close', () => {
            console.log('=== Recent provision logs ===');
            console.log(o || 'No errors found');
            
            // Check 2: Current tenant count
            c.exec('psql "postgresql://n11_db:n11_pass123@localhost:5432/n11_db" -c "SELECT COUNT(*) as total, subdomain FROM tenant_accounts GROUP BY subdomain ORDER BY subdomain;"', (e2, s2) => {
                let o2 = '';
                s2.on('data', d => o2 += d.toString());
                s2.stderr.on('data', d => o2 += d.toString());
                s2.on('close', () => {
                    console.log('\n=== Current tenants ===');
                    console.log(o2);
                    
                    // Check 3: Also check available databases
                    c.exec('psql "postgresql://n11_db:n11_pass123@localhost:5432/n11_db" -c "SELECT datname FROM pg_database WHERE datname LIKE \'%_db\' ORDER BY datname;"', (e3, s3) => {
                        let o3 = '';
                        s3.on('data', d => o3 += d.toString());
                        s3.stderr.on('data', d => o3 += d.toString());
                        s3.on('close', () => {
                            console.log('\n=== Tenant databases ===');
                            console.log(o3);
                            c.end();
                        });
                    });
                });
            });
        });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
