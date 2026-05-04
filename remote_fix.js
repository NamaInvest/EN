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
            console.log('Force pushing Prisma schema and generating client on N11...');
            let res = await execCommand(conn, 'cd /www/wwwroot/n11.namainvist.com && DATABASE_URL="postgresql://postgres@localhost:5432/n11_db?schema=public" npx prisma db push --accept-data-loss && npx prisma generate');
            console.log(res.stdout);
            if (res.stderr) console.error(res.stderr);
            
            console.log('Clearing next cache and rebuilding N11...');
            res = await execCommand(conn, 'cd /www/wwwroot/n11.namainvist.com && rm -rf .next && npm run build');
            console.log(res.stdout);
            if (res.stderr) console.error(res.stderr);
            
            console.log('Restarting PM2...');
            await execCommand(conn, 'pm2 restart saas-app');
            console.log('Done for N11');

            console.log('Force pushing Prisma schema and generating client on N1...');
            res = await execCommand(conn, 'cd /www/wwwroot/n1.namainvist.com && DATABASE_URL="postgresql://postgres@localhost:5432/n1_db?schema=public" npx prisma db push --accept-data-loss && npx prisma generate');
            console.log(res.stdout);
            if (res.stderr) console.error(res.stderr);
            console.log('Clearing next cache and rebuilding N1...');
            res = await execCommand(conn, 'cd /www/wwwroot/n1.namainvist.com && rm -rf .next && npm run build');
            console.log(res.stdout);
            if (res.stderr) console.error(res.stderr);
            await execCommand(conn, 'pm2 restart n1-main');
            console.log('Done for N1');

            console.log('Force pushing Prisma schema and generating client on Main Site...');
            res = await execCommand(conn, 'cd /www/wwwroot/namainvist.com && DATABASE_URL="postgresql://postgres@localhost:5432/namadb?schema=public" npx prisma db push --accept-data-loss && npx prisma generate');
            console.log(res.stdout);
            if (res.stderr) console.error(res.stderr);
            console.log('Clearing next cache and rebuilding Main Site...');
            res = await execCommand(conn, 'cd /www/wwwroot/namainvist.com && rm -rf .next && npm run build');
            console.log(res.stdout);
            if (res.stderr) console.error(res.stderr);
            await execCommand(conn, 'pm2 restart main-site');
            console.log('Done for Main Site');

        } catch (err) {
            console.error(err);
        }
        conn.end();
    });
    conn.connect(SERVER);
}

run();
