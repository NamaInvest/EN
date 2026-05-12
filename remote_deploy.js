const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

function execCmd(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let stdout = '', stderr = '';
            stream.on('data', d => { stdout += d; process.stdout.write(d); });
            stream.stderr.on('data', d => { stderr += d; process.stderr.write(d); });
            stream.on('close', (code) => {
                console.log(`\nCommand exited with code ${code}`);
                resolve({ code, stdout, stderr });
            });
        });
    });
}

async function runDeploy() {
    console.log('Connecting to remote server...');
    const conn = new Client();
    
    conn.on('ready', async () => {
        console.log('Connected! Executing deployment steps...');
        try {
            // Step 1: Pull the latest code
            console.log('\n--- Git Pull ---');
            await execCmd(conn, 'cd /www/wwwroot/namainvist.com && git pull origin main');

            // Step 2: Push Schema to n11_db
            console.log('\n--- Prisma DB Push (n11_db) ---');
            await execCmd(conn, 'cd /www/wwwroot/namainvist.com && DATABASE_URL="postgresql://postgres@localhost:5432/n11_db?schema=public" npx prisma db push --accept-data-loss');

            // Step 3: Push Schema to n1_db
            console.log('\n--- Prisma DB Push (n1_db) ---');
            await execCmd(conn, 'cd /www/wwwroot/namainvist.com && DATABASE_URL="postgresql://postgres@localhost:5432/n1_db?schema=public" npx prisma db push --accept-data-loss');

            // Step 4: Generate Prisma Client
            console.log('\n--- Prisma Generate ---');
            await execCmd(conn, 'cd /www/wwwroot/namainvist.com && npx prisma generate');

            // Step 5: Fix permissions
            console.log('\n--- Fixing DB Permissions ---');
            await execCmd(conn, 'sudo -u postgres psql -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n11_db;" n11_db');
            await execCmd(conn, 'sudo -u postgres psql -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n1_db;" n1_db');

            // Step 6: Build
            console.log('\n--- NPM Run Build ---');
            await execCmd(conn, 'cd /www/wwwroot/namainvist.com && npm run build');

            // Step 7: Restart PM2
            console.log('\n--- Restarting PM2 ---');
            await execCmd(conn, 'pm2 restart all');
            
            console.log('\n✅ Deployment completely finished.');
        } catch (e) {
            console.error('\n❌ Deployment failed:', e);
        } finally {
            conn.end();
        }
    });

    conn.on('error', e => console.error('SSH Connection Error:', e));
    conn.connect(SERVER);
}

runDeploy();
