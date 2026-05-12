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
    console.log('Connecting to remote server to push DB schema...');
    const conn = new Client();
    
    conn.on('ready', async () => {
        console.log('Connected! Executing DB steps...');
        try {
            // Step 1: Push Schema to n11_db using exact version 5.22.0
            console.log('\n--- Prisma DB Push (n11_db) ---');
            await execCmd(conn, 'cd /www/wwwroot/namainvist.com && DATABASE_URL="postgresql://postgres@localhost:5432/n11_db?schema=public" npx prisma@5.22.0 db push --accept-data-loss');

            // Step 2: Push Schema to n1_db using exact version 5.22.0
            console.log('\n--- Prisma DB Push (n1_db) ---');
            await execCmd(conn, 'cd /www/wwwroot/namainvist.com && DATABASE_URL="postgresql://postgres@localhost:5432/n1_db?schema=public" npx prisma@5.22.0 db push --accept-data-loss');

            // Step 3: Restart PM2
            console.log('\n--- Restarting PM2 ---');
            await execCmd(conn, 'pm2 restart all');
            
            console.log('\n✅ DB Deployment finished.');
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
