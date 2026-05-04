const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

function execCommand(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; });
            stream.stderr.on('data', d => { stderr += d; });
            stream.on('close', (code) => resolve({ code, stdout, stderr }));
        });
    });
}

async function run() {
    const conn = new Client();
    conn.on('ready', async () => {
        try {
            console.log('Fetching all _db databases...');
            const dbListRes = await execCommand(conn, 'sudo -u postgres psql -t -c "SELECT datname FROM pg_database WHERE datname LIKE \'%_db\';"');
            
            const databases = dbListRes.stdout.split('\n')
                .map(d => d.trim())
                .filter(d => d.length > 0);
                
            console.log('Found databases:', databases);

            for (const db of databases) {
                console.log(`\n================ Fixing permissions on ${db} ================`);
                
                // For SaaS tenants, the app connects using n11_db user!
                console.log(`Granting permissions on ${db} to user n11_db...`);
                const grantCmd1 = `sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n11_db;" ${db}`;
                const grantCmd2 = `sudo -u postgres psql -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO n11_db;" ${db}`;
                
                const g1 = await execCommand(conn, grantCmd1);
                if (g1.stderr) console.error('Error:', g1.stderr);
                
                const g2 = await execCommand(conn, grantCmd2);
                if (g2.stderr) console.error('Error:', g2.stderr);
                
                console.log(`Successfully granted permissions for ${db}`);
            }

            console.log('\n================ Rebuilding PM2 saas-app ================');
            console.log('Restarting PM2...');
            await execCommand(conn, 'pm2 restart saas-app');
            console.log('Done syncing entire SaaS Fleet!');

        } catch (err) {
            console.error('Script failed:', err);
        }
        conn.end();
    });
    conn.connect(SERVER);
}

run();
