const {Client} = require('ssh2');
const c = new Client();

const serverScript = `
const bcrypt = require('bcryptjs');
const { Client: PgClient } = require('pg');

async function main() {
    const newHash = bcrypt.hashSync('O_O772040030', 10);
    console.log('Hash generated');
    
    const master = new PgClient({ connectionString: 'postgresql://n11_db:n11_pass123@localhost:5432/n11_db' });
    await master.connect();
    const { rows: tenants } = await master.query("SELECT subdomain FROM tenant_accounts");
    await master.end();
    
    console.log('Found ' + tenants.length + ' tenants');
    
    for (const t of tenants) {
        const sub = t.subdomain;
        // Try with dedicated user first, fallback to n11_db
        const connStrings = [
            'postgresql://' + sub + '_db:' + sub + '_pass123@localhost:5432/' + sub + '_db',
            'postgresql://n11_db:n11_pass123@localhost:5432/' + sub + '_db',
        ];
        let success = false;
        for (const cs of connStrings) {
            const tc = new PgClient({ connectionString: cs });
            try {
                await tc.connect();
                const result = await tc.query(
                    'UPDATE users SET password_hash = $1 WHERE username = $2',
                    [newHash, 'admin']
                );
                if (result.rowCount > 0) {
                    console.log('OK ' + sub + ': admin password changed');
                } else {
                    console.log('SKIP ' + sub + ': no admin user');
                }
                success = true;
                await tc.end().catch(() => {});
                break;
            } catch (e) {
                await tc.end().catch(() => {});
                // try next connection string
            }
        }
        if (!success) console.log('ERR ' + sub + ': all connections failed');
    }
    console.log('ALL DONE');
}
main().catch(e => console.error(e));
`;

c.on('ready', () => {
    c.sftp((e, sftp) => {
        sftp.writeFile('/www/wwwroot/namainvist.com/change_pw.js', serverScript, (err) => {
            sftp.end();
            c.exec('cd /www/wwwroot/namainvist.com && node change_pw.js && rm change_pw.js', (e, s) => {
                s.on('data', d => process.stdout.write(d.toString()));
                s.stderr.on('data', d => process.stderr.write(d.toString()));
                s.on('close', () => c.end());
            });
        });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
