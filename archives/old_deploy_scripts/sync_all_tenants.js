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
                console.log(`\n================ Syncing ${db} ================`);
                
                // 1. Prisma db push as postgres
                console.log(`Pushing schema to ${db}...`);
                const pushCmd = `cd /www/wwwroot/namainvist.com && DATABASE_URL="postgresql://postgres@localhost:5432/${db}?schema=public" npx prisma db push --accept-data-loss`;
                const pushRes = await execCommand(conn, pushCmd);
                console.log(pushRes.stdout);
                if (pushRes.stderr && !pushRes.stderr.includes('warn')) {
                    console.error('Error pushing:', pushRes.stderr);
                }

                // 2. Grant permissions
                console.log(`Granting permissions on ${db} to user ${db}...`);
                const grantCmd1 = `sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${db};" ${db}`;
                const grantCmd2 = `sudo -u postgres psql -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ${db};" ${db}`;
                
                await execCommand(conn, grantCmd1);
                await execCommand(conn, grantCmd2);
                console.log(`Successfully synced and granted permissions for ${db}`);
            }

            console.log('\n================ Rebuilding PM2 saas-app ================');
            console.log('Clearing .next cache...');
            await execCommand(conn, 'cd /www/wwwroot/n11.namainvist.com && rm -rf .next && npm run build');
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
